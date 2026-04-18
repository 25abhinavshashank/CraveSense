const { calculatePattern, getDangerZoneSummary, getPatternInsight, getStats } = require('../services/patternService');

function formatDietDays(days) {
  if (!days.length) {
    return 'No clear pattern yet';
  }

  if (days.length === 1) {
    return `Day ${days[0]}`;
  }

  const sorted = [...days].sort((first, second) => first - second);
  const isConsecutive = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  return isConsecutive ? `Day ${sorted[0]}-${sorted[sorted.length - 1]}` : sorted.map((day) => `Day ${day}`).join(', ');
}

async function analyzePattern(req, res, next) {
  try {
    const calculatedPattern = await calculatePattern(req.user._id);
    const insight = await getPatternInsight(req.user, calculatedPattern);

    res.json({
      topTrigger: calculatedPattern.topTrigger,
      dangerHours: calculatedPattern.dangerHourWindows,
      dangerHoursDisplay:
        calculatedPattern.dangerHourWindows.map((window) => window.label).join(', ') || 'No danger windows yet',
      dangerDietDays: calculatedPattern.dangerDietDays,
      dangerDietDaysDisplay: formatDietDays(calculatedPattern.dangerDietDays),
      resistanceRate: calculatedPattern.resistanceRate,
      mostCravedTaste: calculatedPattern.mostCravedTaste,
      weeklyTrend: calculatedPattern.weeklyTrend,
      personalInsight: insight.personalInsight,
      topRecommendation: insight.topRecommendation
    });
  } catch (error) {
    next(error);
  }
}

async function getDangerZone(req, res, next) {
  try {
    const summary = await getDangerZoneSummary(req.user._id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

async function getPatternStats(req, res, next) {
  try {
    const stats = await getStats(req.user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzePattern,
  getDangerZone,
  getPatternStats
};
