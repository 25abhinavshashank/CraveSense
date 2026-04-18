const FoodLog = require('../models/FoodLog');
const { getNutrition } = require('../services/nutritionService');

function getDateKey(date = new Date()) {
  const current = new Date(date);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function summarizeToday(user) {
  const todayKey = getDateKey();
  const entries = await FoodLog.find({ userId: user._id, date: todayKey }).sort({ timestamp: -1 }).lean();

  const grouped = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  const totals = {
    caloriesConsumed: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };

  entries.forEach((entry) => {
    grouped[entry.mealType].push(entry);
    totals.caloriesConsumed += entry.calories;
    totals.protein += entry.protein;
    totals.carbs += entry.carbs;
    totals.fat += entry.fat;
    totals.fiber += entry.fiber;
  });

  const mealTotals = Object.entries(grouped).reduce((accumulator, [mealType, mealEntries]) => {
    accumulator[mealType] = mealEntries.reduce((mealTotal, entry) => mealTotal + entry.calories, 0);
    return accumulator;
  }, {});

  user.caloriesConsumedToday = Math.round(totals.caloriesConsumed);
  user.lastCalorieReset = new Date();
  await user.save();

  return {
    date: todayKey,
    grouped,
    mealTotals,
    totals: {
      ...totals,
      caloriesRemaining: Math.max(0, user.dailyCalorieGoal - totals.caloriesConsumed),
      proteinGoal: user.dailyProteinGoal,
      carbGoal: user.dailyCarbGoal,
      fatGoal: user.dailyFatGoal,
      calorieGoal: user.dailyCalorieGoal
    }
  };
}

async function searchFood(req, res, next) {
  try {
    const query = req.query.query?.trim();
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const nutrition = await getNutrition(query);

    res.json({
      preview: {
        name: nutrition.name || query,
        quantity:
          nutrition.serving_size_g && nutrition.serving_size_g > 0
            ? `${nutrition.serving_size_g}g`
            : query,
        calories: nutrition.calories,
        protein: nutrition.protein_g,
        carbs: nutrition.carbohydrates_total_g,
        fat: nutrition.fat_total_g,
        fiber: nutrition.fiber_g,
        source: nutrition.source
      }
    });
  } catch (error) {
    error.statusCode = error.message.startsWith('Food not found') ? 404 : 500;
    next(error);
  }
}

async function logFood(req, res, next) {
  try {
    const { foodName, quantity, mealType, calories, protein, carbs, fat, fiber, timestamp } = req.body;

    if (!foodName || !quantity || !mealType) {
      return res.status(400).json({ message: 'foodName, quantity, and mealType are required.' });
    }

    const createdAt = timestamp ? new Date(timestamp) : new Date();

    const foodLog = await FoodLog.create({
      userId: req.user._id,
      date: getDateKey(createdAt),
      mealType,
      foodName,
      quantity,
      calories: Number(calories || 0),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fat: Number(fat || 0),
      fiber: Number(fiber || 0),
      timestamp: createdAt
    });

    const summary = await summarizeToday(req.user);

    res.status(201).json({
      message: 'Food logged successfully.',
      entry: foodLog,
      summary
    });
  } catch (error) {
    next(error);
  }
}

async function getTodayFood(req, res, next) {
  try {
    const summary = await summarizeToday(req.user);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

async function deleteFoodLog(req, res, next) {
  try {
    const deletedEntry = await FoodLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Food log entry not found.' });
    }

    const summary = await summarizeToday(req.user);

    res.json({
      message: 'Food log removed successfully.',
      summary
    });
  } catch (error) {
    next(error);
  }
}

async function getFoodSummary(req, res, next) {
  try {
    const summary = await summarizeToday(req.user);
    res.json(summary.totals);
  } catch (error) {
    next(error);
  }
}

async function updateFoodLog(req, res, next) {
  try {
    const { quantity } = req.body;
    if (!quantity) {
      return res.status(400).json({ message: 'New quantity is required.' });
    }

    const entry = await FoodLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: 'Food log entry not found.' });
    }

    const originalMatch = entry.quantity.match(/[\d.]+/);
    const newMatch = quantity.match(/[\d.]+/);

    if (originalMatch && newMatch) {
      const orig = parseFloat(originalMatch[0]);
      const curr = parseFloat(newMatch[0]);
      if (orig > 0) {
        const ratio = curr / orig;
        entry.calories = entry.calories * ratio;
        entry.protein = entry.protein * ratio;
        entry.carbs = entry.carbs * ratio;
        entry.fat = entry.fat * ratio;
        entry.fiber = entry.fiber * ratio;
      }
    }

    entry.quantity = quantity.trim();
    await entry.save();

    const summary = await summarizeToday(req.user);

    res.json({
      message: 'Food log updated successfully.',
      summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  deleteFoodLog,
  getFoodSummary,
  getTodayFood,
  logFood,
  searchFood,
  summarizeToday,
  updateFoodLog
};
