const mongoose = require('mongoose');
const CravingLog = require('../models/CravingLog');
const { generateStructuredJson } = require('./aiService');

const DAY_MS = 24 * 60 * 60 * 1000;
const SUCCESS_OUTCOMES = ['resisted', 'completed_challenge'];

function getDateKey(date) {
  const current = new Date(date);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameCalendarDay(firstDate, secondDate) {
  return getDateKey(firstDate) === getDateKey(secondDate);
}

function formatHour(hour) {
  const normalizedHour = Number.isFinite(hour) ? hour : 0;
  const period = normalizedHour >= 12 ? 'PM' : 'AM';
  const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${twelveHour} ${period}`;
}

function formatHourWindow(hour) {
  const start = formatHour(hour);
  const end = formatHour((hour + 1) % 24);
  return `${start} - ${end}`;
}

function calculateDietDay(user, at = new Date()) {
  const dietStart = new Date(user.dietStartDate || user.createdAt || Date.now());
  const targetTime = new Date(at);
  return Math.max(1, Math.floor((targetTime - dietStart) / DAY_MS) + 1);
}

async function calculatePattern(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const cravingMatch = { userId: objectId, hungerType: 'craving' };
  const breakMatch = { ...cravingMatch, outcome: 'gave_in' };

  const [triggerStats, hourStats, dayStats, total, resisted, tasteStats] = await Promise.all([
    CravingLog.aggregate([
      { $match: breakMatch },
      { $group: { _id: '$trigger', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]),
    CravingLog.aggregate([
      { $match: breakMatch },
      { $group: { _id: '$hourOfDay', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]),
    CravingLog.aggregate([
      { $match: breakMatch },
      { $group: { _id: '$dietDay', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 2 }
    ]),
    CravingLog.countDocuments(cravingMatch),
    CravingLog.countDocuments({ ...cravingMatch, outcome: { $in: SUCCESS_OUTCOMES } }),
    CravingLog.aggregate([
      { $match: cravingMatch },
      { $group: { _id: '$tasteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ])
  ]);

  const now = new Date();
  const thisWeekStart = new Date(now.getTime() - 6 * DAY_MS);
  const lastWeekStart = new Date(now.getTime() - 13 * DAY_MS);
  const lastWeekEnd = new Date(now.getTime() - 7 * DAY_MS);

  const [thisWeekTotal, thisWeekSuccess, lastWeekTotal, lastWeekSuccess] = await Promise.all([
    CravingLog.countDocuments({ ...cravingMatch, timestamp: { $gte: thisWeekStart } }),
    CravingLog.countDocuments({
      ...cravingMatch,
      timestamp: { $gte: thisWeekStart },
      outcome: { $in: SUCCESS_OUTCOMES }
    }),
    CravingLog.countDocuments({
      ...cravingMatch,
      timestamp: { $gte: lastWeekStart, $lte: lastWeekEnd }
    }),
    CravingLog.countDocuments({
      ...cravingMatch,
      timestamp: { $gte: lastWeekStart, $lte: lastWeekEnd },
      outcome: { $in: SUCCESS_OUTCOMES }
    })
  ]);

  const thisWeekResistanceRate =
    thisWeekTotal > 0 ? Math.round((thisWeekSuccess / thisWeekTotal) * 100) : 0;
  const lastWeekResistanceRate =
    lastWeekTotal > 0 ? Math.round((lastWeekSuccess / lastWeekTotal) * 100) : 0;

  let weeklyTrend = 'stable';
  if (thisWeekResistanceRate > lastWeekResistanceRate) {
    weeklyTrend = 'improving';
  } else if (thisWeekResistanceRate < lastWeekResistanceRate) {
    weeklyTrend = 'declining';
  }

  return {
    topTrigger: triggerStats[0]?._id || 'unknown',
    dangerHours: hourStats.map((entry) => entry._id).filter((hour) => Number.isInteger(hour)),
    dangerHourWindows: hourStats.map((entry) => ({
      hour: entry._id,
      count: entry.count,
      label: formatHourWindow(entry._id)
    })),
    dangerDietDays: dayStats.map((entry) => entry._id).filter((day) => Number.isFinite(day)),
    resistanceRate: total > 0 ? Math.round((resisted / total) * 100) : 0,
    mostCravedTaste: tasteStats[0]?._id || 'sweet',
    weeklyTrend,
    totalCravings: total
  };
}

async function getPatternInsight(user, calculatedPattern) {
  const today = new Date();

  if (
    user.lastInsightDate &&
    user.lastPatternInsight?.personalInsight &&
    isSameCalendarDay(new Date(user.lastInsightDate), today)
  ) {
    return user.lastPatternInsight;
  }

  const prompt = `
You are a friendly diet coach. Based on this user's craving data:
- Top trigger: ${calculatedPattern.topTrigger}
- Danger hours: ${calculatedPattern.dangerHours.map((hour) => `${hour}:00`).join(', ') || 'None'}
- Diet days they usually break: Day ${calculatedPattern.dangerDietDays.join(' and ') || '1'}
- Resistance rate: ${calculatedPattern.resistanceRate}%
- Most craved taste: ${calculatedPattern.mostCravedTaste}
- Weekly trend: ${calculatedPattern.weeklyTrend}

Write ONLY a JSON with these two fields, no markdown:
{
  "personalInsight": "2-3 sentences talking directly to the user like a friend. Be specific, use their actual numbers.",
  "topRecommendation": "One concrete actionable tip based on their pattern."
}
`;

  let insight;

  try {
    insight = await generateStructuredJson(prompt);
  } catch (error) {
    const primaryWindow = calculatedPattern.dangerHourWindows[0]?.label || 'your usual late-window';
    insight = {
      personalInsight: `You most often struggle when ${calculatedPattern.topTrigger} kicks in, especially around ${primaryWindow}. Your resistance rate is ${calculatedPattern.resistanceRate}%, so there is already a base of wins to build on.`,
      topRecommendation: `Protect ${primaryWindow} with a planned low-calorie snack and a short movement break before the craving usually peaks.`
    };
  }

  user.lastPatternInsight = insight;
  user.lastInsightDate = today;
  await user.save();

  return insight;
}

async function getDangerZoneSummary(userId) {
  const pattern = await calculatePattern(userId);
  const currentHour = new Date().getHours();
  const currentHourInDangerZone = pattern.dangerHours.includes(currentHour);

  return {
    currentHour,
    currentHourLabel: formatHourWindow(currentHour),
    dangerHours: pattern.dangerHourWindows,
    currentHourInDangerZone,
    warningMessage: currentHourInDangerZone
      ? `Based on your craving history, ${formatHourWindow(currentHour)} is one of your danger windows.`
      : null
  };
}

async function getStats(user) {
  const objectId = new mongoose.Types.ObjectId(user._id);
  const cravingMatch = { userId: objectId, hungerType: 'craving' };
  const now = new Date();
  const todayKey = getDateKey(now);

  const sevenDayStart = new Date(now.getTime() - 6 * DAY_MS);
  const fourteenDayStart = new Date(now.getTime() - 13 * DAY_MS);

  const [todayLogs, currentWeekLogs, previousWeekLogs, totalLogs, successLogs] = await Promise.all([
    CravingLog.find({
      ...cravingMatch,
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).lean(),
    CravingLog.find({ ...cravingMatch, timestamp: { $gte: sevenDayStart } }).lean(),
    CravingLog.find({
      ...cravingMatch,
      timestamp: { $gte: fourteenDayStart, $lt: sevenDayStart }
    }).lean(),
    CravingLog.countDocuments(cravingMatch),
    CravingLog.countDocuments({ ...cravingMatch, outcome: { $in: SUCCESS_OUTCOMES } })
  ]);

  const currentWeekSummary = {
    successful: 0,
    resisted: 0,
    gaveIn: 0,
    healthySwap: 0
  };

  const previousWeekSummary = {
    successful: 0,
    total: previousWeekLogs.length
  };

  const dayBuckets = new Map();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now.getTime() - index * DAY_MS);
    const key = getDateKey(date);
    dayBuckets.set(key, {
      date: key,
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      resisted: 0,
      gaveIn: 0,
      healthySwap: 0
    });
  }

  currentWeekLogs.forEach((log) => {
    const key = getDateKey(log.timestamp);
    const bucket = dayBuckets.get(key);

    if (log.outcome === 'gave_in') {
      currentWeekSummary.gaveIn += 1;
      if (bucket) {
        bucket.gaveIn += 1;
      }
      return;
    }

    if (log.outcome === 'ate_healthy_swap') {
      currentWeekSummary.healthySwap += 1;
      currentWeekSummary.successful += 1;
      if (bucket) {
        bucket.healthySwap += 1;
      }
      return;
    }

    currentWeekSummary.resisted += 1;
    currentWeekSummary.successful += 1;
    if (bucket) {
      bucket.resisted += 1;
    }
  });

  previousWeekLogs.forEach((log) => {
    if (SUCCESS_OUTCOMES.includes(log.outcome) || log.outcome === 'ate_healthy_swap') {
      previousWeekSummary.successful += 1;
    }
  });

  const currentWeekRate =
    currentWeekLogs.length > 0 ? Math.round((currentWeekSummary.successful / currentWeekLogs.length) * 100) : 0;
  const previousWeekRate =
    previousWeekSummary.total > 0
      ? Math.round((previousWeekSummary.successful / previousWeekSummary.total) * 100)
      : 0;

  return {
    today: {
      date: todayKey,
      cravingsLogged: todayLogs.length,
      resisted: todayLogs.filter((log) => SUCCESS_OUTCOMES.includes(log.outcome)).length,
      healthySwap: todayLogs.filter((log) => log.outcome === 'ate_healthy_swap').length,
      gaveIn: todayLogs.filter((log) => log.outcome === 'gave_in').length
    },
    resistanceRate: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0,
    dietStreak: calculateDietDay(user),
    weeklyComparison: {
      currentWeekRate,
      previousWeekRate,
      delta: currentWeekRate - previousWeekRate,
      trend:
        currentWeekRate > previousWeekRate
          ? 'improving'
          : currentWeekRate < previousWeekRate
            ? 'declining'
            : 'stable'
    },
    currentWeek: currentWeekSummary,
    weeklyProgress: Array.from(dayBuckets.values())
  };
}

module.exports = {
  calculateDietDay,
  calculatePattern,
  formatHourWindow,
  getDangerZoneSummary,
  getPatternInsight,
  getStats
};
