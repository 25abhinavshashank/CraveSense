const { GoogleGenerativeAI } = require('@google/generative-ai');

const generativeClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const FALLBACK_SUGGESTIONS = {
  sweet: [
    { name: 'Greek yogurt with cinnamon', calories: 110, why: 'Creamy and sweet without a sugar spike.' },
    { name: 'Apple slices with peanut butter', calories: 180, why: 'Gives sweetness plus a little staying power.' },
    { name: 'Dark chocolate square with tea', calories: 90, why: 'Takes the edge off a dessert craving fast.' }
  ],
  salty: [
    { name: 'Roasted chana', calories: 120, why: 'Crunchy and salty with extra protein.' },
    { name: 'Air-popped popcorn', calories: 95, why: 'Low-calorie volume for a snacky urge.' },
    { name: 'Cucumber with chaat masala', calories: 35, why: 'Hits salty cravings with almost no calorie damage.' }
  ],
  oily: [
    { name: 'Paneer tikka bites', calories: 160, why: 'Feels rich and satisfying without deep frying.' },
    { name: 'Hummus with carrot sticks', calories: 140, why: 'Gives a creamy texture that scratches the fried-food itch.' },
    { name: 'Roasted makhana', calories: 115, why: 'Crunchy and buttery-feeling at a lower calorie cost.' }
  ],
  spicy: [
    { name: 'Masala buttermilk', calories: 70, why: 'Cooling but still spicy enough to satisfy the urge.' },
    { name: 'Spicy boiled corn cup', calories: 130, why: 'Warm, spicy, and filling without being too heavy.' },
    { name: 'Kimchi cucumber salad', calories: 55, why: 'Sharp flavor that calms a spicy craving quickly.' }
  ],
  specific: [
    { name: 'Fruit bowl with chaat masala', calories: 95, why: 'Fresh and flavorful when the craving feels vague.' },
    { name: 'Protein shake with ice', calories: 150, why: 'Buys fullness and helps protect your calorie goal.' },
    { name: 'Green tea and sugar-free gum', calories: 10, why: 'A fast reset when you mostly need the urge to pass.' }
  ]
};

function getModel() {
  return generativeClient?.getGenerativeModel({ model: 'gemini-2.0-flash' }) || null;
}

function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new Error('AI returned an empty response.');
  }

  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonCandidate =
    firstBrace !== -1 && lastBrace !== -1 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  return JSON.parse(jsonCandidate);
}

async function generateStructuredJson(prompt) {
  const model = getModel();

  if (!model) {
    throw new Error('Gemini API key is not configured.');
  }

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}

function buildFallbackFoodSuggestions(tasteType, remainingCalories, excludeFoods = []) {
  if (remainingCalories < 100) {
    return [
      { name: 'Green tea', calories: 2, why: 'Keeps your mouth busy while the craving wave passes.' },
      { name: 'Sparkling water with lime', calories: 5, why: 'Cold fizz helps interrupt the urge.' },
      { name: 'Sugar-free gum', calories: 5, why: 'Gives your brain a quick flavor reset.' }
    ].filter(item => !excludeFoods.includes(item.name));
  }

  const calorieCap = Math.max(0, Math.min(200, remainingCalories));
  const suggestions = (FALLBACK_SUGGESTIONS[tasteType] || FALLBACK_SUGGESTIONS.specific).filter(
    (item) => item.calories <= calorieCap && !excludeFoods.includes(item.name)
  );

  if (suggestions.length >= 3) {
    return suggestions.slice(0, 3);
  }

  const genericFallback = FALLBACK_SUGGESTIONS.specific.filter(
    (item) => item.calories <= calorieCap && !excludeFoods.includes(item.name)
  );

  return [...suggestions, ...genericFallback].slice(0, 3);
}

function buildFallbackCravingResponse(cravingData, userData) {
  const remainingCalories = Math.max(
    0,
    (userData.dailyCalorieGoal || 1500) - (userData.caloriesConsumedToday || 0)
  );
  const challengeType = cravingData.intensity >= 7 ? 'walk' : 'breathing';
  const dangerTime = userData.recentPattern?.mostCommonBreakTime || `${cravingData.hourOfDay}:00`;

  return {
    motivation: `${userData.name}, you are on day ${cravingData.dietDay} and this is exactly the kind of moment that builds momentum. You usually wobble around ${dangerTime}, so if you can stretch this out for 10 minutes, you're rewriting the pattern in real time.`,
    challenge: {
      type: challengeType,
      instruction:
        challengeType === 'walk'
          ? 'Walk for 10 minutes right now. This craving will pass in 15 minutes.'
          : 'Take 10 slow breaths, then stretch your shoulders and neck for 2 minutes. This craving will pass in 15 minutes.',
      durationSeconds: 600
    },
    foodSuggestions: buildFallbackFoodSuggestions(cravingData.tasteType, remainingCalories, cravingData.excludeFoods),
    warningMessage:
      dangerTime === `${cravingData.hourOfDay}:00`
        ? `Heads up: ${dangerTime} is one of your usual danger hours.`
        : null
  };
}

async function getCravingResponse(cravingData, userData) {
  const remainingCalories = Math.max(
    0,
    (userData.dailyCalorieGoal || 1500) - (userData.caloriesConsumedToday || 0)
  );
  const maxSuggestionCalories = Math.max(0, Math.min(200, remainingCalories));
  const recentPattern = userData.recentPattern || {};

  const prompt = `
You are a personal diet coach for ${userData.name}. Be direct, warm, and real - not preachy.

User situation:
- Daily calorie goal: ${userData.dailyCalorieGoal} cal
- Calories consumed today: ${userData.caloriesConsumedToday} cal  
- Remaining calories: ${remainingCalories} cal
- Diet day: Day ${cravingData.dietDay}
- Current time: ${cravingData.hourOfDay}:00 hrs
- Craving type: ${cravingData.tasteType}
- Specific food craving: ${cravingData.specificFood ? cravingData.specificFood : 'None specified'}
- Trigger: ${cravingData.trigger}
- Intensity: ${cravingData.intensity}/10
- Their pattern: They usually break their diet at ${recentPattern.mostCommonBreakTime || 'unknown'}
- Their resistance rate: ${recentPattern.resistanceRate || 0}%

Respond ONLY in this exact JSON format, no markdown, no backticks:
{
  "motivation": "2-3 sentence personal message. Reference their diet day and pattern. Be real and specific.",
  "challenge": {
    "type": "pushups OR walk OR breathing OR stretch",
    "instruction": "Do X [action] right now. This craving will pass in 15 minutes.",
    "durationSeconds": 600
  },
  "foodSuggestions": [
    { "name": "food name", "calories": 150, "why": "one line reason it satisfies ${cravingData.tasteType} craving" },
    { "name": "food name", "calories": 120, "why": "..." },
    { "name": "food name", "calories": 90,  "why": "..." }
  ],
  "warningMessage": "one line warning if this is their typical danger time, else null"
}

Rules for foodSuggestions:
- ALL suggestions must be under ${maxSuggestionCalories} calories
- Match the taste type: ${cravingData.tasteType}${cravingData.specificFood ? ` and specifically provide healthy, satisfying alternatives to their craving for ${cravingData.specificFood}` : ''}
${cravingData.excludeFoods && cravingData.excludeFoods.length > 0 ? `- DO NOT suggest any of these foods: ${cravingData.excludeFoods.join(', ')}` : ''}
- Use realistic, commonly available Indian/global foods
- If remaining calories < 100, suggest zero-calorie options like water, green tea, gum
`;

  try {
    const parsed = await generateStructuredJson(prompt);
    const safeSuggestions = Array.isArray(parsed.foodSuggestions)
      ? parsed.foodSuggestions
          .map((suggestion) => ({
            name: suggestion.name || 'Smart option',
            calories: Number(suggestion.calories || 0),
            why: suggestion.why || `A lighter option for a ${cravingData.tasteType} craving.`
          }))
          .filter((suggestion) =>
            remainingCalories < 100 ? suggestion.calories <= 20 : suggestion.calories <= maxSuggestionCalories
          )
      : [];

    return {
      ...parsed,
      foodSuggestions:
        safeSuggestions.length > 0
          ? safeSuggestions.slice(0, 3)
          : buildFallbackFoodSuggestions(cravingData.tasteType, remainingCalories, cravingData.excludeFoods)
    };
  } catch (error) {
    return buildFallbackCravingResponse(cravingData, userData);
  }
}

module.exports = {
  generateStructuredJson,
  getCravingResponse
};
