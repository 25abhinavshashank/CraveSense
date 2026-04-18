const BACKEND_URL = 'https://cravesense.onrender.com/api';
const DASHBOARD_URL = 'https://crave-sense-sable.vercel.app/dashboard';
const PENDING_LOGS_KEY = 'cravesense_pending_logs';
/** Same key as content.js — holds JWT from dashboard tab (cookie partition fix). */
const ACCESS_TOKEN_STORAGE_KEY = 'cravesense_access_token';

const state = {
  accessToken: null,
  authenticated: false,
  offline: false,
  selectedTaste: 'sweet',
  selectedTrigger: 'bored',
  intensity: 5,
  aiResponse: null,
  timerId: null,
  timerRemaining: 600
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  hydrateDefaults();
  boot();
});

function cacheElements() {
  elements.screens = Array.from(document.querySelectorAll('.screen'));
  elements.statusBanner = document.getElementById('status-banner');
  elements.loadingOverlay = document.getElementById('loading-overlay');
  elements.loadingText = elements.loadingOverlay.querySelector('p');
  elements.realHungerForm = document.getElementById('real-hunger-form');
  elements.realHungerFood = document.getElementById('real-hunger-food');
  elements.realHungerCalories = document.getElementById('real-hunger-calories');
  elements.intensitySlider = document.getElementById('intensity-slider');
  elements.intensityValue = document.getElementById('intensity-value');
  elements.specificFoodInput = document.getElementById('specific-food-input');
  elements.motivationText = document.getElementById('motivation-text');
  elements.challengeText = document.getElementById('challenge-text');
  elements.challengeTimer = document.getElementById('challenge-timer');
  elements.suggestionsSubtitle = document.getElementById('suggestions-subtitle');
  elements.suggestionList = document.getElementById('suggestion-list');
  elements.gaveInForm = document.getElementById('gave-in-form');
  elements.gaveInFood = document.getElementById('gave-in-food');
  elements.gaveInCalories = document.getElementById('gave-in-calories');
  elements.resultTitle = document.getElementById('result-title');
  elements.resultBody = document.getElementById('result-body');
  elements.resultMeta = document.getElementById('result-meta');
}

function bindEvents() {
  document.getElementById('open-dashboard-top').addEventListener('click', openDashboard);
  document.getElementById('open-dashboard-btn').addEventListener('click', openDashboard);
  document.getElementById('close-popup-btn').addEventListener('click', () => window.close());
  document.getElementById('start-over-btn').addEventListener('click', resetFlow);
  document.getElementById('real-hunger-btn').addEventListener('click', () => toggleRealHungerForm(true));
  document.getElementById('craving-btn').addEventListener('click', () => showScreen('screen-2'));
  document.getElementById('back-to-screen-1').addEventListener('click', () => showScreen('screen-1'));
  document.getElementById('get-help-btn').addEventListener('click', handleGetHelp);
  document.getElementById('challenge-complete-btn').addEventListener('click', handleChallengeComplete);
  document.getElementById('still-craving-btn').addEventListener('click', handleStillCraving);
  document.getElementById('regenerate-suggestions-btn').addEventListener('click', handleRegenerateSuggestions);
  elements.realHungerForm.addEventListener('submit', handleRealHungerSubmit);
  elements.gaveInForm.addEventListener('submit', handleGaveInSubmit);
  document.getElementById('login-on-web-btn').addEventListener('click', openDashboard);

  elements.intensitySlider.addEventListener('input', (event) => {
    state.intensity = Number(event.target.value);
    elements.intensityValue.textContent = String(state.intensity);
  });

  Array.from(document.querySelectorAll('.pill-button')).forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.group;
      const value = button.dataset.value;

      if (group === 'taste') {
        state.selectedTaste = value;
      }

      if (group === 'trigger') {
        state.selectedTrigger = value;
      }

      updateSelectedPills(group, value);
    });
  });
}

function hydrateDefaults() {
  updateSelectedPills('taste', state.selectedTaste);
  updateSelectedPills('trigger', state.selectedTrigger);
  elements.intensityValue.textContent = String(state.intensity);
}

async function boot() {
  setLoading(true, 'Syncing with Dashboard...');
  const authenticated = await refreshAccessToken();
  
  if (!authenticated) {
    setLoading(false);
    showScreen('screen-auth-required');
    return;
  }

  await syncPendingLogs();
  updateStatusBanner();
  setLoading(false);
  showScreen('screen-1');
}

function showScreen(screenId) {
  elements.screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function setLoading(visible, message = 'Working on it...') {
  elements.loadingText.textContent = message;
  elements.loadingOverlay.classList.toggle('hidden', !visible);
}

function toggleRealHungerForm(visible) {
  elements.realHungerForm.classList.toggle('hidden', !visible);
  if (visible) {
    elements.realHungerFood.focus();
  }
}

function updateSelectedPills(group, value) {
  Array.from(document.querySelectorAll(`.pill-button[data-group="${group}"]`)).forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.value === value);
  });
}

function setStatusBanner(message, variant = 'warning') {
  if (!message) {
    elements.statusBanner.className = 'status-banner hidden';
    elements.statusBanner.textContent = '';
    return;
  }

  elements.statusBanner.className = `status-banner ${variant}`;
  elements.statusBanner.textContent = message;
}

function updateStatusBanner() {
  const pendingLogs = getPendingLogs();

  if (state.offline) {
    setStatusBanner('Backend unreachable. Logs will be saved locally and synced when the server is back.', 'danger');
    return;
  }

  if (!state.authenticated) {
    setStatusBanner('Sign in on the web dashboard to sync your data. Local logging still works here.', 'warning');
    return;
  }

  if (pendingLogs.length > 0) {
    setStatusBanner(`${pendingLogs.length} offline log${pendingLogs.length === 1 ? '' : 's'} waiting to sync.`, 'warning');
    return;
  }

  setStatusBanner('');
}

function getPendingLogs() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function setPendingLogs(logs) {
  localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(logs));
  updatePendingBadge(logs.length);
}

function queueOfflineLog(payload) {
  const logs = getPendingLogs();
  logs.push(payload);
  setPendingLogs(logs);
}

function updatePendingBadge(count) {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'pending-count', count }, () => {
      void chrome.runtime.lastError;
    });
  }
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function startTimer(seconds) {
  clearTimer();
  state.timerRemaining = seconds;
  elements.challengeTimer.textContent = formatTime(state.timerRemaining);

  state.timerId = window.setInterval(() => {
    state.timerRemaining = Math.max(0, state.timerRemaining - 1);
    elements.challengeTimer.textContent = formatTime(state.timerRemaining);

    if (state.timerRemaining === 0) {
      clearTimer();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function getStoredAccessToken() {
  if (!chrome?.storage?.local) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    chrome.storage.local.get([ACCESS_TOKEN_STORAGE_KEY], (result) => {
      resolve(result[ACCESS_TOKEN_STORAGE_KEY] || null);
    });
  });
}

function setStoredAccessToken(token) {
  if (!chrome?.storage?.local) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    if (!token) {
      chrome.storage.local.remove(ACCESS_TOKEN_STORAGE_KEY, () => resolve());
      return;
    }
    chrome.storage.local.set({ [ACCESS_TOKEN_STORAGE_KEY]: token }, () => resolve());
  });
}

async function validateAccessToken(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** If a dashboard tab is open, ask it to POST /auth/refresh (same cookie partition as login). */
async function trySyncFromOpenDashboardTab() {
  if (!chrome?.tabs?.sendMessage || !chrome?.tabs?.query) {
    return;
  }
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ url: 'https://crave-sense-sable.vercel.app/*' }, resolve);
  });
  for (const tab of tabs) {
    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { type: 'cravesense-request-sync' }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    } catch {
      /* tab may not have injected content script yet */
    }
  }
}

/**
 * Web login sets httpOnly refresh cookies in the *website* partition; the popup runs on
 * chrome-extension:// and does not receive those cookies. The dashboard content script
 * writes the access JWT here; we validate it first, then fall back to refresh() if possible.
 */
async function refreshAccessToken() {
  try {
    let stored = await getStoredAccessToken();
    if (stored) {
      const ok = await validateAccessToken(stored);
      if (ok) {
        state.accessToken = stored;
        state.authenticated = true;
        state.offline = false;
        return true;
      }
      await setStoredAccessToken(null);
    }

    await trySyncFromOpenDashboardTab();
    stored = await getStoredAccessToken();
    if (stored) {
      const okAfterSync = await validateAccessToken(stored);
      if (okAfterSync) {
        state.accessToken = stored;
        state.authenticated = true;
        state.offline = false;
        return true;
      }
      await setStoredAccessToken(null);
    }

    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      state.accessToken = null;
      state.authenticated = false;
      return false;
    }

    const data = await response.json();
    state.accessToken = data.accessToken;
    state.authenticated = Boolean(data.accessToken);
    state.offline = false;
    if (data.accessToken) {
      await setStoredAccessToken(data.accessToken);
    }
    return state.authenticated;
  } catch (error) {
    state.offline = true;
    state.accessToken = null;
    state.authenticated = false;
    return false;
  }
}

async function apiFetch(path, options = {}) {
  const { body, method = 'GET', headers = {}, requireAuth = true, retryOnAuth = true } = options;
  const requestHeaders = { ...headers };

  if (body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (requireAuth) {
    if (!state.accessToken) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error(state.offline ? 'offline' : 'unauthorized');
      }
    }

    requestHeaders.Authorization = `Bearer ${state.accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body
    });
    state.offline = false;
  } catch (error) {
    state.offline = true;
    throw new Error('offline');
  }

  if (response.status === 401 && requireAuth && retryOnAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, { ...options, retryOnAuth: false });
    }
    throw new Error('unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = 'Request failed.';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (error) {
      if (errorText) {
        message = errorText;
      }
    }
    throw new Error(message);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function deriveMealType({ hungerType, timestamp }) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const hour = date.getHours();

  if (hungerType === 'real_hunger') {
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
  }

  return 'snack';
}

async function tryLogFoodDirectly({ foodName, calories, hungerType, timestamp }) {
  const trimmedName = String(foodName || '').trim();
  const numericCalories = Number(calories || 0);

  if (!trimmedName || !numericCalories || numericCalories <= 0) {
    return;
  }

  // Best-effort: do not block craving logging if food endpoint fails.
  try {
    await apiFetch('/food/log', {
      method: 'POST',
      body: JSON.stringify({
        foodName: trimmedName,
        quantity: '1 serving',
        mealType: deriveMealType({ hungerType, timestamp }),
        calories: numericCalories,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        timestamp: timestamp || new Date().toISOString()
      })
    });
  } catch (error) {
    // Silent on purpose: users still get craving logged; dashboard food log may lag.
  }
}

async function syncPendingLogs() {
  const pendingLogs = getPendingLogs();
  if (!pendingLogs.length || !state.authenticated || state.offline) {
    updatePendingBadge(pendingLogs.length);
    return;
  }

  const remainingLogs = [];
  for (const log of pendingLogs) {
    try {
      await apiFetch('/craving/log', {
        method: 'POST',
        body: JSON.stringify(log)
      });
    } catch (error) {
      remainingLogs.push(log);
      state.offline = error.message === 'offline';
      if (state.offline) {
        break;
      }
    }
  }

  setPendingLogs(remainingLogs);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildFallbackAiResponse(excludeFoods = []) {
  const remainingCalories = 200;
  const suggestionsByTaste = {
    sweet: [
      { name: 'Greek yogurt with cinnamon', calories: 110, why: 'Creamy and sweet without a sugar crash.' },
      { name: 'Apple with peanut butter', calories: 180, why: 'Sweet plus a little fat to slow things down.' },
      { name: 'Dark chocolate square with tea', calories: 90, why: 'Small, satisfying, and controlled.' },
      { name: 'Frozen grapes', calories: 60, why: 'Like little popsicles, takes time to eat.' },
      { name: 'Banana with almond butter', calories: 190, why: 'Very filling and naturally sweet.' },
      { name: 'Sugar-free jello', calories: 15, why: 'Zero guilt high volume sweet fix.' },
      { name: 'Dates with walnuts', calories: 150, why: 'Chewy and rich caramel-like flavor.' },
      { name: 'Protein pudding', calories: 140, why: 'Hits the dessert craving while building muscle.' },
      { name: 'Fresh berries bowl', calories: 70, why: 'High fiber, very sweet, low calories.' },
      { name: 'Rice cake with jam', calories: 85, why: 'Crispy and jammy without the heavy pastry.' },
      { name: 'Diet soda or flavored sparkling water', calories: 0, why: 'Fills your stomach and satisfies the sweet tooth.' },
      { name: 'Mango slices with chili powder', calories: 100, why: 'Sweet and tangy distraction.' },
      { name: 'Oatmeal with stevia and berries', calories: 150, why: 'Warm, comforting, and sweet.' },
      { name: 'Cottage cheese with pineapple', calories: 160, why: 'Sweetness with serious staying power.' },
      { name: 'A small piece of dark jaggery', calories: 40, why: 'Intense flavor that naturally stops you from eating more.' }
    ],
    salty: [
      { name: 'Roasted chana', calories: 120, why: 'Crunchy and salty with extra protein.' },
      { name: 'Air-popped popcorn', calories: 95, why: 'Low-calorie volume for a snacky urge.' },
      { name: 'Cucumber with chaat masala', calories: 35, why: 'Hits salty cravings with almost no calorie damage.' },
      { name: 'Roasted edamame', calories: 130, why: 'Salty, savory, and protein-packed.' },
      { name: 'Salted almonds (handful)', calories: 160, why: 'Crunchy fat that fills you up fast.' },
      { name: 'Pretzels', calories: 110, why: 'Fast salty carbs to kill the craving.' },
      { name: 'Celery with a pinch of sea salt', calories: 15, why: 'Maximum crunch, minimal calories.' },
      { name: 'Rice crackers', calories: 90, why: 'Light and crispy alternative to chips.' },
      { name: 'Pickles', calories: 10, why: 'Intensely salty without the calorie burden.' },
      { name: 'Salted pumpkin seeds', calories: 140, why: 'Great crunch and very satisfying.' },
      { name: 'Boiled egg with pepper and salt', calories: 75, why: 'Protein immediately kills the urge to overeat.' },
      { name: 'Olives', calories: 60, why: 'Rich salty bite that buys you time.' },
      { name: 'Baked veggie chips', calories: 120, why: 'Feels like junk food but much safer.' },
      { name: 'String cheese', calories: 80, why: 'Salty snack that is portion-controlled.' },
      { name: 'Miso soup', calories: 40, why: 'Warm salty liquid tricks the stomach quickly.' }
    ],
    oily: [
      { name: 'Paneer tikka bites', calories: 160, why: 'Feels rich and satisfying without deep frying.' },
      { name: 'Hummus with carrot sticks', calories: 140, why: 'Gives a creamy texture that scratches the fried-food itch.' },
      { name: 'Roasted makhana', calories: 115, why: 'Crunchy and buttery-feeling at a lower calorie cost.' },
      { name: 'Avocado toast on thin bread', calories: 180, why: 'Healthy fats that feel extremely indulgent.' },
      { name: 'Peanut butter on celery', calories: 130, why: 'Oily and crunchy combo that works perfectly.' },
      { name: 'Mini cheese wheel', calories: 70, why: 'Rich, creamy portion-controlled bite.' },
      { name: 'Roasted pistachios', calories: 150, why: 'Shelling them slows you down while giving you rich fats.' },
      { name: 'A small handful of salted cashews', calories: 160, why: 'Very creamy texture for an oily craving.' },
      { name: 'Greek yogurt dip with cucumber', calories: 90, why: 'Creamy feeling without actually being oily.' },
      { name: 'Sliced tofu stir-fried lightly', calories: 120, why: 'Satisfies the savory pan-fried craving.' },
      { name: 'Half an avocado with salt', calories: 110, why: 'Pure, satisfying, healthy fats.' },
      { name: 'Baked falafel bite', calories: 80, why: 'Tastes deep-fried but is actually baked.' },
      { name: 'Chia seed pudding', calories: 160, why: 'Creamy texture that takes time to digest.' },
      { name: 'Unsweetened coconut flakes', calories: 120, why: 'Rich coconut oil feel with good crunch.' },
      { name: 'A tsp of olive oil on cherry tomatoes', calories: 60, why: 'Mediterranean style rich snack.' }
    ],
    spicy: [
      { name: 'Masala buttermilk', calories: 70, why: 'Cooling but still spicy enough to satisfy the urge.' },
      { name: 'Spicy boiled corn cup', calories: 130, why: 'Warm, spicy, and filling without being too heavy.' },
      { name: 'Kimchi cucumber salad', calories: 55, why: 'Sharp flavor that calms a spicy craving quickly.' },
      { name: 'Spicy roasted chickpeas', calories: 120, why: 'Crunchy and hot, replacing spicy chips.' },
      { name: 'Jalapeno slices with light cream cheese', calories: 90, why: 'Spicy bite with a cooling finish.' },
      { name: 'Spicy salsa with celery sticks', calories: 30, why: 'Heavy spice, almost zero calories.' },
      { name: 'Sriracha on a boiled egg', calories: 75, why: 'Quick protein punch with a spicy kick.' },
      { name: 'Steamed momos with hot sauce', calories: 150, why: 'Feels like a cheat meal but is just steamed.' },
      { name: 'Spicy tomato soup', calories: 90, why: 'Warm spicy liquid fills you up.' },
      { name: 'Chili-lime roasted almonds', calories: 150, why: 'Spicy crunch that lasts a while.' },
      { name: 'Puffed rice (bhel) without sweet chutney', calories: 110, why: 'Lots of volume and fiery spices.' },
      { name: 'Spicy lentil wafers (papad)', calories: 45, why: 'Roasted loud crunch with sharp spice.' },
      { name: 'Buffalo cauliflower bites (baked)', calories: 80, why: 'Spicy wing alternative.' },
      { name: 'Clear hot and sour soup', calories: 60, why: 'Light but extremely flavorful.' },
      { name: 'Radish slices with spicy salt', calories: 15, why: 'Natural spicy bite of the radish with extra seasoning.' }
    ],
    specific: [
      { name: 'Fruit bowl with chaat masala', calories: 95, why: 'Fresh and flavorful when the craving feels vague.' },
      { name: 'Protein shake with ice', calories: 150, why: 'Buys fullness and helps protect your calorie goal.' },
      { name: 'Green tea and sugar-free gum', calories: 10, why: 'A fast reset when you mostly need the urge to pass.' },
      { name: 'Black coffee or tea', calories: 5, why: 'Caffeine suppresses appetite quickly.' },
      { name: 'Warm lemon water with mint', calories: 10, why: 'Refreshing and settles the stomach.' },
      { name: 'Bone broth or clear veg broth', calories: 40, why: 'Warm and very savory.' },
      { name: 'Sliced apple', calories: 90, why: 'Simple, crunchy, and hydrating.' },
      { name: 'A large glass of ice water', calories: 0, why: 'Sometimes the body just misinterprets thirst.' },
      { name: 'Carrots and hummus', calories: 120, why: 'Classic combination for any mood.' },
      { name: 'Boiled sprouts', calories: 100, why: 'Earthy and fills the stomach well.' },
      { name: 'Roasted peanuts', calories: 150, why: 'A handful can kill any random craving.' },
      { name: 'Plain popcorn', calories: 80, why: 'High volume, low cost.' },
      { name: 'Diet cola', calories: 0, why: 'The carbonation distracts the craving center.' },
      { name: 'Mint leaves with fennel seeds', calories: 5, why: 'Freshens the mouth and changes the palate.' },
      { name: 'Cherry tomatoes', calories: 30, why: 'Poppable sweet and sour snacks.' }
    ]
  };

  let candidates = (suggestionsByTaste[state.selectedTaste] || suggestionsByTaste.sweet)
    .filter((item) => item.calories <= remainingCalories && !excludeFoods.includes(item.name));

  if (candidates.length < 3) {
    const extra = suggestionsByTaste.specific.filter(
      (item) => item.calories <= remainingCalories && !excludeFoods.includes(item.name)
    );
    candidates = [...candidates, ...extra];
  }

  // Shuffle and pick 3 to ensure randomly different choices each load
  candidates = shuffleArray(candidates);
  let suggestions = candidates.slice(0, 3);

  return {
    motivation: `You caught the craving before autopilot took over, and that matters. Give yourself 10 minutes right now - this is usually enough time to break the impulse loop.`,
    challenge: {
      type: state.intensity >= 7 ? 'walk' : 'breathing',
      instruction:
        state.intensity >= 7
          ? 'Walk for 10 minutes right now. This craving will pass in 15 minutes.'
          : 'Take 10 slow breaths, then stretch for 2 minutes. This craving will pass in 15 minutes.',
      durationSeconds: 600
    },
    foodSuggestions: suggestions.slice(0, 3),
    warningMessage: null,
    meta: {
      caloriesRemaining: remainingCalories
    }
  };
}

function getCurrentCravingPayload() {
  const now = new Date();
  return {
    hungerType: 'craving',
    tasteType: state.selectedTaste,
    trigger: state.selectedTrigger,
    intensity: state.intensity,
    specificFood: elements.specificFoodInput.value.trim(),
    challengeGiven: state.aiResponse?.challenge?.instruction || '',
    aiMotivation: state.aiResponse?.motivation || '',
    aiSuggestions: state.aiResponse?.foodSuggestions || [],
    hourOfDay: now.getHours(),
    dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now)
  };
}

function renderChallengeScreen() {
  const warningText = state.aiResponse.warningMessage ? ` ${state.aiResponse.warningMessage}` : '';
  elements.motivationText.textContent = `${state.aiResponse.motivation}${warningText}`;
  elements.challengeText.textContent = state.aiResponse.challenge.instruction;
  startTimer(state.aiResponse.challenge.durationSeconds || 600);
  showScreen('screen-3');
}

function renderSuggestionScreen() {
  const remainingCalories = state.aiResponse.meta?.caloriesRemaining ?? 0;
  elements.suggestionsSubtitle.textContent = `You have ${remainingCalories} calories left today. Pick something that keeps you in control.`;
  elements.suggestionList.innerHTML = '';

  state.aiResponse.foodSuggestions.forEach((suggestion, index) => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <h3>${suggestion.name}</h3>
      <p>${Math.round(suggestion.calories)} cal | ${suggestion.why}</p>
      <button class="primary-button" type="button" data-index="${index}">I'll Eat This</button>
    `;
    card.querySelector('button').addEventListener('click', () => handleSuggestionChoice(index));
    elements.suggestionList.appendChild(card);
  });

  showScreen('screen-4');
}

async function handleGetHelp() {
  const payload = {
    tasteType: state.selectedTaste,
    trigger: state.selectedTrigger,
    intensity: state.intensity,
    specificFood: elements.specificFoodInput.value.trim()
  };

  setLoading(true, 'Building your coaching response...');

  try {
    state.aiResponse = buildFallbackAiResponse();
    renderChallengeScreen();
  } catch (error) {
    state.aiResponse = buildFallbackAiResponse();
    renderChallengeScreen();
  } finally {
    updateStatusBanner();
    setLoading(false);
  }
}

async function handleRegenerateSuggestions() {
  if (!state.rejectedFoods) {
    state.rejectedFoods = [];
  }
  const currentFoods = state.aiResponse?.foodSuggestions?.map(s => s.name) || [];
  currentFoods.forEach(food => {
    if (!state.rejectedFoods.includes(food)) {
      state.rejectedFoods.push(food);
    }
  });

  setLoading(true, 'Finding different options...');

  try {
    state.aiResponse = buildFallbackAiResponse(state.rejectedFoods);
    renderSuggestionScreen();
  } catch (error) {
    setStatusBanner('Could not fetch new options. Please try again.', 'warning');
  } finally {
    setLoading(false);
  }
}

async function saveCravingLog(payload) {
  const completePayload = {
    ...payload,
    timestamp: new Date().toISOString()
  };

  if (state.offline || !state.authenticated) {
    queueOfflineLog(completePayload);
    updateStatusBanner();
    return { synced: false };
  }

  try {
    await apiFetch('/craving/log', {
      method: 'POST',
      body: JSON.stringify(completePayload)
    });
    await syncPendingLogs();
    updateStatusBanner();
    return { synced: true };
  } catch (error) {
    queueOfflineLog(completePayload);
    state.offline = error.message === 'offline';
    updateStatusBanner();
    return { synced: false };
  }
}

async function fetchWeeklyHandledCount() {
  if (!state.authenticated || state.offline) {
    return 0;
  }

  try {
    const stats = await apiFetch('/pattern/stats');
    return stats.currentWeek?.successful || 0;
  } catch (error) {
    return 0;
  }
}

function showResult({ title, body, meta }) {
  elements.resultTitle.textContent = title;
  elements.resultBody.textContent = body;
  elements.resultMeta.textContent = meta;
  showScreen('screen-5');
}

async function handleChallengeComplete() {
  clearTimer();
  setLoading(true, 'Logging your win...');

  const result = await saveCravingLog({
    ...getCurrentCravingPayload(),
    outcome: 'completed_challenge',
    challengeCompleted: true
  });

  const weeklyHandled = await fetchWeeklyHandledCount();
  setLoading(false);

  showResult({
    title: 'You resisted.',
    body: `That is ${weeklyHandled} cravings handled this week. This data is making your pattern clearer.`,
    meta: result.synced
      ? 'Saved to your account.'
      : 'Saved locally. It will sync to your dashboard when the backend is available.'
  });
}

function handleStillCraving() {
  clearTimer();
  renderSuggestionScreen();
}

async function handleSuggestionChoice(index) {
  const suggestion = state.aiResponse.foodSuggestions[index];
  if (!suggestion) {
    return;
  }

  setLoading(true, 'Logging your smart swap...');

  const timestamp = new Date().toISOString();
  const result = await saveCravingLog({
    ...getCurrentCravingPayload(),
    outcome: 'ate_healthy_swap',
    challengeCompleted: false,
    caloriesConsumed: suggestion.calories,
    foodEaten: suggestion.name,
    timestamp
  });

  if (result.synced) {
    await tryLogFoodDirectly({
      foodName: suggestion.name,
      calories: suggestion.calories,
      hungerType: 'craving',
      timestamp
    });
  }

  setLoading(false);

  showResult({
    title: 'Smart choice.',
    body: 'You stayed in control and picked a lower-cost option instead of going fully off track.',
    meta: result.synced
      ? 'Saved to your account.'
      : 'Saved locally. It will sync to your dashboard when the backend is available.'
  });
}

async function handleGaveInSubmit(event) {
  event.preventDefault();

  const foodName = elements.gaveInFood.value.trim();
  const calories = Number(elements.gaveInCalories.value || 0);
  if (!foodName || !calories) {
    setStatusBanner('Add both the food name and calories so the log stays useful.', 'warning');
    return;
  }

  setLoading(true, 'Logging this craving...');

  const timestamp = new Date().toISOString();
  const result = await saveCravingLog({
    ...getCurrentCravingPayload(),
    outcome: 'gave_in',
    challengeCompleted: false,
    caloriesConsumed: calories,
    foodEaten: foodName,
    timestamp
  });

  if (result.synced) {
    await tryLogFoodDirectly({
      foodName,
      calories,
      hungerType: 'craving',
      timestamp
    });
  }

  setLoading(false);

  showResult({
    title: 'Logged.',
    body: 'No guilt - this is just data now. Check the dashboard later to see what pattern this adds to.',
    meta: result.synced
      ? 'Saved to your account.'
      : 'Saved locally. It will sync to your dashboard when the backend is available.'
  });
}

async function handleRealHungerSubmit(event) {
  event.preventDefault();

  const foodName = elements.realHungerFood.value.trim();
  const calories = Number(elements.realHungerCalories.value || 0);
  if (!foodName || !calories) {
    setStatusBanner('Add what you are eating and the calories so the log is complete.', 'warning');
    return;
  }

  setLoading(true, 'Logging real hunger...');

  const timestamp = new Date().toISOString();
  const result = await saveCravingLog({
    hungerType: 'real_hunger',
    tasteType: 'specific',
    trigger: 'other',
    intensity: 2,
    specificFood: foodName,
    challengeGiven: 'Logged as real hunger',
    challengeCompleted: true,
    outcome: 'ate_healthy_swap',
    caloriesConsumed: calories,
    foodEaten: foodName,
    aiMotivation: 'Logged as real hunger in the extension.',
    aiSuggestions: [],
    timestamp
  });

  if (result.synced) {
    await tryLogFoodDirectly({
      foodName,
      calories,
      hungerType: 'real_hunger',
      timestamp
    });
  }

  setLoading(false);

  showResult({
    title: 'Real hunger logged.',
    body: 'You checked in instead of guessing. That keeps the data clean and your calories visible.',
    meta: result.synced
      ? 'Saved to your account.'
      : 'Saved locally. It will sync to your dashboard when the backend is available.'
  });
}

function resetFlow() {
  clearTimer();
  state.aiResponse = null;
  state.intensity = 5;
  elements.intensitySlider.value = '5';
  elements.intensityValue.textContent = '5';
  elements.specificFoodInput.value = '';
  elements.realHungerFood.value = '';
  elements.realHungerCalories.value = '';
  elements.gaveInFood.value = '';
  elements.gaveInCalories.value = '';
  toggleRealHungerForm(false);
  showScreen('screen-1');
}

function openDashboard() {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'open-dashboard' }, () => {
      void chrome.runtime.lastError;
    });
    return;
  }

  window.open(DASHBOARD_URL, '_blank');
}
