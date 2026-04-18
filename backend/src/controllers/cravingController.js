const CravingLog = require('../models/CravingLog');
const FoodLog = require('../models/FoodLog');
const { getCravingResponse } = require('../services/aiService');
const { calculateDietDay, calculatePattern, formatHourWindow } = require('../services/patternService');
const { getNutrition } = require('../services/nutritionService');

function getDateKey(date = new Date()) {
  const current = new Date(date);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function syncCaloriesConsumedToday(user) {
  const todayKey = getDateKey();
  const foodEntries = await FoodLog.find({ userId: user._id, date: todayKey }).lean();
  const caloriesConsumedToday = foodEntries.reduce((total, entry) => total + Number(entry.calories || 0), 0);
  user.caloriesConsumedToday = Math.round(caloriesConsumedToday);
  user.lastCalorieReset = new Date();
  await user.save();
}

async function maybeLogFoodFromCraving(user, cravingLog, quantity) {
  if (!cravingLog.caloriesConsumed || cravingLog.caloriesConsumed <= 0) {
    return;
  }

  const foodName = cravingLog.foodEaten || cravingLog.specificFood || 'Unspecified snack';
  let protein = 0, carbs = 0, fat = 0, fiber = 0;

  try {
    const queryStr = quantity ? `${quantity} ${foodName}` : foodName;
    const nutrition = await getNutrition(queryStr);
    
    if (nutrition && nutrition.calories > 0) {
      const ratio = cravingLog.caloriesConsumed / nutrition.calories;
      protein = Math.round((nutrition.protein_g || 0) * ratio * 10) / 10;
      carbs = Math.round((nutrition.carbohydrates_total_g || 0) * ratio * 10) / 10;
      fat = Math.round((nutrition.fat_total_g || 0) * ratio * 10) / 10;
      fiber = Math.round((nutrition.fiber_g || 0) * ratio * 10) / 10;
    }
  } catch (error) {
    // Fail gracefully with zeros if food lookup fails
  }

  const hour = new Date(cravingLog.timestamp).getHours();
  let mealType = 'snack';
  if (cravingLog.hungerType === 'real_hunger') {
    if (hour >= 5 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 16) mealType = 'lunch';
    else if (hour >= 16 && hour < 22) mealType = 'dinner';
  }

  await FoodLog.create({
    userId: user._id,
    date: getDateKey(cravingLog.timestamp),
    mealType,
    foodName,
    quantity: quantity || '1 serving',
    calories: cravingLog.caloriesConsumed,
    protein,
    carbs,
    fat,
    fiber,
    timestamp: cravingLog.timestamp
  });
}

async function logCraving(req, res, next) {
  try {
    const eventTime = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    const hungerType = req.body.hungerType || 'craving';
    const tasteType =
      req.body.tasteType || (hungerType === 'real_hunger' ? 'specific' : 'sweet');
    const trigger =
      req.body.trigger || (hungerType === 'real_hunger' ? 'other' : 'habit');

    const cravingLog = await CravingLog.create({
      userId: req.user._id,
      timestamp: eventTime,
      dayOfWeek: req.body.dayOfWeek,
      hourOfDay: req.body.hourOfDay,
      dietDay: calculateDietDay(req.user, eventTime),
      hungerType,
      tasteType,
      specificFood: req.body.specificFood || '',
      trigger,
      intensity: Number(req.body.intensity || (hungerType === 'real_hunger' ? 3 : 5)),
      challengeGiven: req.body.challengeGiven || '',
      challengeCompleted: Boolean(req.body.challengeCompleted),
      outcome: req.body.outcome || (hungerType === 'real_hunger' ? 'ate_healthy_swap' : 'gave_in'),
      caloriesConsumed: Number(req.body.caloriesConsumed || 0),
      foodEaten: req.body.foodEaten || '',
      aiMotivation: req.body.aiMotivation || '',
      aiSuggestions: Array.isArray(req.body.aiSuggestions)
        ? req.body.aiSuggestions.map((suggestion) => ({
            name: suggestion.name,
            calories: Number(suggestion.calories || 0),
            why: suggestion.why || '',
            taste: tasteType
          }))
        : []
    });

    if (cravingLog.caloriesConsumed > 0) {
      await maybeLogFoodFromCraving(req.user, cravingLog, req.body.quantity);
      await syncCaloriesConsumedToday(req.user);
    }

    res.status(201).json({
      message: 'Craving logged successfully.',
      log: cravingLog
    });
  } catch (error) {
    next(error);
  }
}

async function getTodayCravings(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logs = await CravingLog.find({
      userId: req.user._id,
      timestamp: { $gte: startOfDay }
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({ logs });
  } catch (error) {
    next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days || 30)));
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const logs = await CravingLog.find({
      userId: req.user._id,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({ logs, days });
  } catch (error) {
    next(error);
  }
}

async function getAIResponse(req, res, next) {
  try {
    const eventTime = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    const user = req.user || {
      _id: 'guest',
      name: 'Guest',
      dailyCalorieGoal: 2000,
      caloriesConsumedToday: 0
    };

    const pattern = user._id === 'guest' ? { dangerHours: [], resistanceRate: 0 } : await calculatePattern(user._id);
    const lastBreakLog = user._id === 'guest' ? null : await CravingLog.findOne({
      userId: user._id,
      outcome: 'gave_in'
    })
      .sort({ timestamp: -1 })
      .lean();

    const cravingData = {
      tasteType: req.body.tasteType || 'sweet',
      trigger: req.body.trigger || 'other',
      intensity: Number(req.body.intensity || 5),
      specificFood: req.body.specificFood || '',
      excludeFoods: Array.isArray(req.body.excludeFoods) ? req.body.excludeFoods : [],
      hourOfDay: eventTime.getHours(),
      dietDay: user._id === 'guest' ? 1 : calculateDietDay(user, eventTime)
    };

    const userData = {
      name: user.name,
      dailyCalorieGoal: user.dailyCalorieGoal,
      caloriesConsumedToday: user.caloriesConsumedToday,
      recentPattern: {
        mostCommonBreakTime: pattern.dangerHours[0] !== undefined ? formatHourWindow(pattern.dangerHours[0]) : 'varied times',
        resistanceRate: pattern.resistanceRate,
        lastBreakReason: lastBreakLog?.trigger || 'unknown'
      }
    };

    const aiResponse = await getCravingResponse(cravingData, userData);

    res.json({
      ...aiResponse,
      meta: {
        caloriesRemaining: Math.max(0, user.dailyCalorieGoal - user.caloriesConsumedToday),
        dietDay: cravingData.dietDay
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAIResponse,
  getHistory,
  getTodayCravings,
  logCraving
};
