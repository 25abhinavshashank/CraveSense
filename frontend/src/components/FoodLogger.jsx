import { useMemo, useState } from 'react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function FoodLogger({ api, foodData, foodSummary, onUpdated }) {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('dinner');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editQuantityInput, setEditQuantityInput] = useState('');

  const meals = useMemo(() => foodData?.grouped || {}, [foodData]);
  const mealTotals = foodData?.mealTotals || {};

  const scaleRatio = useMemo(() => {
    if (!preview || !preview.quantity) return 1;
    const originalMatch = preview.quantity.match(/[\d.]+/);
    const newMatch = quantityInput.match(/[\d.]+/);

    if (originalMatch && newMatch) {
      const orig = parseFloat(originalMatch[0]);
      const curr = parseFloat(newMatch[0]);
      if (orig > 0) return curr / orig;
    }
    return 1;
  }, [preview, quantityInput]);

  const getScaled = (val) => val != null ? val * scaleRatio : 0;

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    setError('');
    setPreview(null);

    try {
      const { data } = await api.get(`/food/search?query=${encodeURIComponent(query.trim())}`);
      setPreview(data.preview);
      setQuantityInput(data.preview?.quantity || query.trim());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Food search failed. Try a more specific query.');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!preview) {
      return;
    }

    if (!quantityInput.trim()) {
      setError('Please add the quantity before saving the food log.');
      return;
    }

    setAdding(true);
    setError('');

    try {
      const { data } = await api.post('/food/log', {
        foodName: preview.name,
        quantity: quantityInput.trim() || preview.quantity,
        mealType: selectedMeal,
        calories: getScaled(preview.calories),
        protein: getScaled(preview.protein),
        carbs: getScaled(preview.carbs),
        fat: getScaled(preview.fat),
        fiber: getScaled(preview.fiber)
      });

      setPreview(null);
      setQuantityInput('');
      setQuery('');
      onUpdated?.(data.summary);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add this food log.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/food/log/${id}`);
      onUpdated?.(data.summary);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete that food log.');
    }
  };

  const handleUpdateQuantity = async (id) => {
    if (!editQuantityInput.trim()) {
      setEditingEntry(null);
      return;
    }

    try {
      const { data } = await api.put(`/food/log/${id}`, { quantity: editQuantityInput.trim() });
      setEditingEntry(null);
      setEditQuantityInput('');
      onUpdated?.(data.summary);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update food quantity.');
    }
  };

  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <div>
          <h2 className="section-title">Today's Food Log</h2>
          <p className="mt-1 copy-muted">Search foods, confirm nutrition, and keep your macro targets honest.</p>
        </div>

        <span className="rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white">
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          )}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/10 px-6 py-6">
          {/* {foodSummary && (
            <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 border border-white/5">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${foodSummary.caloriesConsumed > foodSummary.calorieGoal ? 'bg-danger animate-pulse' : 'bg-brand'}`} />
                <p className="text-sm font-semibold text-white/90">
                  Today&apos;s Total: <span className={foodSummary.caloriesConsumed > foodSummary.calorieGoal ? 'text-danger' : 'text-brand-light text-brand'}>{Math.round(foodSummary.caloriesConsumed || 0)}</span>
                  <span className="ml-1 text-xs text-muted font-normal">/ {foodSummary.calorieGoal} cal</span>
                </p>
              </div>
              <p className="hidden text-xs font-medium uppercase tracking-widest text-muted sm:block">
                {foodSummary.caloriesConsumed > foodSummary.calorieGoal ? 'Limit Exceeded' : 'On Track'}
              </p>
            </div>
          )} */}
          {foodSummary ? (
            <div className={` mb-5 rounded-3xl border p-5 transition-colors ${(foodSummary.caloriesConsumed || 0) > (foodSummary.calorieGoal || 0)
              ? 'border-danger/30 bg-danger/10'
              : 'border-brand/20 bg-brand/10'
              }`}>
              <p className={`font-bold ${(foodSummary.caloriesConsumed || 0) > (foodSummary.calorieGoal || 0) ? 'text-danger' : 'text-white'}`}>
                Total Consumed: {Math.round(foodSummary.caloriesConsumed || 0)} / {foodSummary.calorieGoal || 0} cal
              </p>
              {(foodSummary.caloriesConsumed || 0) > (foodSummary.calorieGoal || 0) ? (
                <p className="mt-2 text-sm font-medium text-danger/90">
                  ⚠️ Over Target: You have exceeded your goal by {Math.round(foodSummary.caloriesConsumed - foodSummary.calorieGoal)} calories.
                </p>
              ) : (
                <p className="mt-2 text-sm text-white/75">
                  Safe: You have {Math.round(foodSummary.caloriesRemaining || 0)} calories remaining for the day.
                </p>
              )}
            </div>
          ) : null}
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSearch}>
            <input
              className="input-field flex-1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search food, for example: 100g chicken breast"
            />
            <button type="submit" className="primary-btn" disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          ) : null}

          {preview ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold">{preview.name}</h3>
                  <p className="mt-2 text-sm text-white/70">{quantityInput || 'Add a quantity below'}</p>
                </div>
                {preview.source === 'ai_estimated' ? (
                  <span className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                    AI Estimated
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-white/80">
                {Math.round(getScaled(preview.calories))} cal | {Math.round(getScaled(preview.protein))}g protein | {Math.round(getScaled(preview.carbs))}g carbs | {Math.round(getScaled(preview.fat))}g fat | {Math.round(getScaled(preview.fiber))}g fiber
              </p>

              <div className="mt-5">
                <label className="label-text">Quantity</label>
                <input
                  className="input-field"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  placeholder="Example: 100g, 2 eggs, 1 bowl"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {MEAL_TYPES.map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    className={`pill-button ${selectedMeal === meal ? 'pill-button-active' : ''}`}
                    onClick={() => setSelectedMeal(meal)}
                  >
                    {capitalize(meal)}
                  </button>
                ))}
              </div>

              <button type="button" className="primary-btn mt-5" onClick={handleAdd} disabled={adding}>
                {adding ? 'Adding...' : 'Add to Log'}
              </button>
            </div>
          ) : null}

          <div className="mt-8 space-y-5">
            {MEAL_TYPES.map((mealType) => {
              const entries = meals[mealType] || [];
              return (
                <div key={mealType} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">{capitalize(mealType)}</h3>
                    <span className="text-sm text-muted">{Math.round(mealTotals[mealType] || 0)} cal</span>
                  </div>

                  {entries.length ? (
                    <div className="mt-4 space-y-3">
                      {entries.map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                          <div className="flex-1">
                            <p className="font-medium text-white">{entry.foodName}</p>
                            {editingEntry === entry._id ? (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  className="input-field max-w-[120px] text-sm py-1 px-2"
                                  value={editQuantityInput}
                                  onChange={(e) => setEditQuantityInput(e.target.value)}
                                  placeholder="e.g. 150g"
                                  autoFocus
                                />
                                <button type="button" className="text-brand text-xs font-semibold" onClick={() => handleUpdateQuantity(entry._id)}>SAVE</button>
                                <button type="button" className="text-muted text-xs" onClick={() => setEditingEntry(null)}>CANCEL</button>
                              </div>
                            ) : (
                              <p className="mt-1 text-sm text-muted">
                                {entry.quantity} | {Math.round(entry.calories)} cal
                              </p>
                            )}
                          </div>

                          {editingEntry !== entry._id && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-brand hover:text-brand"
                                onClick={() => {
                                  setEditingEntry(entry._id);
                                  setEditQuantityInput(entry.quantity);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-danger hover:text-danger"
                                onClick={() => handleDelete(entry._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted">No foods logged for {mealType} yet.</p>
                  )}
                </div>
              );
            })}
          </div>


        </div>
      ) : null}
    </section>
  );
}
