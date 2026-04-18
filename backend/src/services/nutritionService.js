const { generateStructuredJson } = require('./aiService');

const COMMON_FOOD_FALLBACKS = [
  {
    patterns: [/^\d*\s*egg$/i, /^\d*\s*eggs$/i],
    data: {
      name: 'Egg',
      calories: 78,
      protein_g: 6.3,
      carbohydrates_total_g: 0.6,
      fat_total_g: 5.3,
      fiber_g: 0,
      serving_size_g: 50
    }
  },
  {
    patterns: [/^\d*\s*banana$/i, /^\d*\s*bananas$/i],
    data: {
      name: 'Banana',
      calories: 105,
      protein_g: 1.3,
      carbohydrates_total_g: 27,
      fat_total_g: 0.4,
      fiber_g: 3.1,
      serving_size_g: 118
    }
  },
  {
    patterns: [/^\d*\s*apple$/i, /^\d*\s*apples$/i],
    data: {
      name: 'Apple',
      calories: 95,
      protein_g: 0.5,
      carbohydrates_total_g: 25,
      fat_total_g: 0.3,
      fiber_g: 4.4,
      serving_size_g: 182
    }
  },
  {
    patterns: [/^\d*\s*milk$/i],
    data: {
      name: 'Milk',
      calories: 61,
      protein_g: 3.2,
      carbohydrates_total_g: 4.8,
      fat_total_g: 3.3,
      fiber_g: 0,
      serving_size_g: 100
    }
  },
  {
    patterns: [/^\d*\s*rice$/i, /^\d*\s*bowl of rice$/i],
    data: {
      name: 'Cooked Rice',
      calories: 130,
      protein_g: 2.7,
      carbohydrates_total_g: 28.2,
      fat_total_g: 0.3,
      fiber_g: 0.4,
      serving_size_g: 100
    }
  },
  {
    patterns: [/^\d*\s*chicken breast$/i, /^\d*\s*chicken$/i],
    data: {
      name: 'Chicken Breast',
      calories: 165,
      protein_g: 31,
      carbohydrates_total_g: 0,
      fat_total_g: 3.6,
      fiber_g: 0,
      serving_size_g: 100
    }
  },
  {
    patterns: [/^\d*\s*oats$/i, /^\d*\s*oatmeal$/i],
    data: {
      name: 'Oats',
      calories: 389,
      protein_g: 16.9,
      carbohydrates_total_g: 66.3,
      fat_total_g: 6.9,
      fiber_g: 10.6,
      serving_size_g: 100
    }
  },
  {
    patterns: [/^\d*\s*paneer$/i],
    data: {
      name: 'Paneer',
      calories: 265,
      protein_g: 18.3,
      carbohydrates_total_g: 1.2,
      fat_total_g: 20.8,
      fiber_g: 0,
      serving_size_g: 100
    }
  }
];

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function calculateMacroCalories(nutrition) {
  return (
    toNumber(nutrition.protein_g) * 4 +
    toNumber(nutrition.carbohydrates_total_g) * 4 +
    toNumber(nutrition.fat_total_g) * 9 +
    toNumber(nutrition.fiber_g) * 2
  );
}

function normalizeNutrition(data, query, source) {
  const normalized = {
    source,
    name: data.name || query,
    calories: toNumber(data.calories),
    protein_g: toNumber(data.protein_g ?? data.protein),
    carbohydrates_total_g: toNumber(data.carbohydrates_total_g ?? data.carbohydrates ?? data.carbs ?? 0),
    fat_total_g: toNumber(data.fat_total_g ?? data.fat ?? data.fat_g ?? 0),
    fiber_g: toNumber(data.fiber_g ?? data.fiber ?? 0),
    serving_size_g: toNumber(data.serving_size_g ?? data.serving_size) || 100
  };

  const derivedCalories = calculateMacroCalories(normalized);
  if (normalized.calories <= 0 && derivedCalories > 0) {
    normalized.calories = Math.round(derivedCalories);
  }

  return normalized;
}

function looksReliableNutrition(nutrition) {
  const hasUsefulNumbers =
    nutrition.calories > 0 ||
    nutrition.protein_g > 0 ||
    nutrition.carbohydrates_total_g > 0 ||
    nutrition.fat_total_g > 0 ||
    nutrition.fiber_g > 0;

  if (!hasUsefulNumbers) {
    return false;
  }

  const derivedCalories = calculateMacroCalories(nutrition);
  if (derivedCalories >= 30 && nutrition.calories <= 0) {
    return false;
  }

  if (nutrition.calories > 0 && derivedCalories > 0) {
    const differenceRatio = Math.abs(nutrition.calories - derivedCalories) / Math.max(derivedCalories, 1);
    if (differenceRatio > 0.65) {
      return false;
    }
  }

  return true;
}

function getCommonFoodFallback(query) {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const match = COMMON_FOOD_FALLBACKS.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(normalizedQuery))
  );

  if (!match) {
    return null;
  }

  return normalizeNutrition(match.data, query, 'local_fallback');
}

function extractNutrientValue(foodNutrients = [], matcher) {
  if (!Array.isArray(foodNutrients)) {
    return 0;
  }

  const matched = foodNutrients.find((nutrient) => {
    const name = String(nutrient.nutrientName || nutrient.name || '').toLowerCase();
    const number = String(nutrient.nutrientNumber || nutrient.number || '').toLowerCase();
    const unit = String(nutrient.unitName || nutrient.unit || '').toLowerCase();
    return matcher({ name, number, unit, nutrient });
  });

  return toNumber(matched?.value ?? matched?.amount ?? matched?.nutrientValue ?? 0);
}

function normalizeUsdaFood(food, query) {
  const nutrients = food?.foodNutrients || [];

  const calories =
    extractNutrientValue(nutrients, ({ name, unit }) => name === 'energy' && unit === 'kcal') ||
    extractNutrientValue(nutrients, ({ name, unit }) => name === 'energy' && unit === 'kcals') ||
    extractNutrientValue(nutrients, ({ name, number }) => name === 'energy' || number === '208');

  const protein_g = extractNutrientValue(nutrients, ({ name, number }) => name === 'protein' || number === '203');
  const fat_total_g = extractNutrientValue(nutrients, ({ name, number }) => name.includes('total lipid') || number === '204');
  const carbohydrates_total_g = extractNutrientValue(nutrients, ({ name, number }) => name.includes('carbohydrate') || number === '205');
  const fiber_g = extractNutrientValue(
    nutrients,
    ({ name, number }) => name.includes('fiber') || name.includes('fibre') || number === '291'
  );

  const servingSize = toNumber(food?.servingSize ?? food?.serving_size ?? 0);
  const servingUnit = String(food?.servingSizeUnit ?? food?.serving_size_unit ?? '').toLowerCase();
  const serving_size_g =
    servingSize > 0 && (servingUnit === 'g' || servingUnit === 'gram' || servingUnit === 'grams')
      ? servingSize
      : 100;

  return normalizeNutrition(
    {
      name: food?.description || food?.lowercaseDescription || food?.name || query,
      calories,
      protein_g,
      carbohydrates_total_g,
      fat_total_g,
      fiber_g,
      serving_size_g
    },
    query,
    'usda_fdc'
  );
}

async function getUsdaNutrition(query) {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '5');
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const foods = Array.isArray(data?.foods) ? data.foods : [];
  if (!foods.length) {
    return null;
  }

  return normalizeUsdaFood(foods[0], query);
}

async function getAiEstimatedNutrition(query) {
  const prompt = `
Give nutrition info for: "${query}"
Respond ONLY in JSON, no markdown:
{ "name": "food name", "calories": 0, "protein_g": 0, "carbohydrates_total_g": 0, "fat_total_g": 0, "fiber_g": 0, "serving_size_g": 0 }
Use standard nutritional values. If quantity is not specified, use one standard serving for simple foods and 100g for bulk ingredients.
Be accurate.
`;

  const parsed = await generateStructuredJson(prompt);
  return normalizeNutrition(parsed, query, 'ai_estimated');
}

async function getNutrition(query) {
  if (!query || !query.trim()) {
    throw new Error('A search query is required.');
  };

  try {
    const usdaNutrition = await getUsdaNutrition(query);
    if (usdaNutrition && looksReliableNutrition(usdaNutrition)) {
      return usdaNutrition;
    }
  } catch (error) {
    console.warn('Nutrition lookup via USDA failed, falling back to Gemini.');
  }

  // Skip COMMON_FOOD_FALLBACKS initially so AI can genuinely process edge cases
  /*
  const commonFallback = getCommonFoodFallback(query);
  if (commonFallback) {
    return commonFallback;
  }
  */

  try {
    const aiEstimate = await getAiEstimatedNutrition(query);
    if (looksReliableNutrition(aiEstimate)) {
      return aiEstimate;
    }
  } catch (error) {
    console.warn('Gemini nutrition request failed. Error:', error);
  }

  const finalFallback = getCommonFoodFallback(query);
  if (finalFallback) {
    return finalFallback;
  }

  throw new Error("Food not found. Try: '2 eggs' or 'bowl of rice'.");
}

module.exports = {
  getNutrition
};
