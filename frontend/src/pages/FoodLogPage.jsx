import { useEffect, useState } from 'react';
import CalorieTracker from '../components/CalorieTracker';
import FoodLogger from '../components/FoodLogger';
import MacroRings from '../components/MacroRings';

export default function FoodLogPage({ api, user, onUserUpdate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [foodSummary, setFoodSummary] = useState(null);

  const syncUserCalories = (summaryPayload) => {
    if (!summaryPayload) {
      return;
    }

    onUserUpdate((currentUser) => ({
      ...currentUser,
      caloriesConsumedToday: Math.round(summaryPayload.caloriesConsumed || 0)
    }));
  };

  const loadFoodPage = async () => {
    setLoading(true);
    setError('');

    try {
      const [foodTodayResponse, foodSummaryResponse] = await Promise.all([
        api.get('/food/today'),
        api.get('/food/summary')
      ]);

      setFoodData(foodTodayResponse.data);
      setFoodSummary(foodSummaryResponse.data);
      syncUserCalories(foodSummaryResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the food log right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoodPage();
  }, []);

  const handleFoodUpdated = async (summaryPayload) => {
    if (summaryPayload) {
      setFoodData(summaryPayload);
      setFoodSummary(summaryPayload.totals);
      syncUserCalories(summaryPayload.totals);
      return;
    }

    await loadFoodPage();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-8 lg:px-10">
        <div className="panel w-full max-w-md p-10 text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <h1 className="font-display text-2xl font-semibold">Loading Food Log</h1>
          <p className="mt-3 copy-muted">Pulling your meals, macros, and calories together.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-10 pt-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="panel p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Food Tracking</p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Log food on its own page - clean and focused.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
              Search a food, choose the meal, edit the quantity properly, and keep your calories and macros updated without mixing this into the full dashboard.
            </p>
          </section>

          <CalorieTracker consumed={foodSummary?.caloriesConsumed || user.caloriesConsumedToday || 0} goal={user.dailyCalorieGoal} />
        </div> */}

        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
        ) : null}

        <MacroRings summary={foodSummary} />

        <FoodLogger api={api} foodData={foodData} foodSummary={foodSummary} onUpdated={handleFoodUpdated} />
      </div>
    </div>
  );
}
