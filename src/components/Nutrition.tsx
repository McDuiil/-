import React, { useState } from "react";
import { Plus, Clock, ChevronRight, PieChart, Utensils, X, Calendar, Zap, Settings } from "lucide-react";
import GlassCard from "./GlassCard";
import { useApp } from "@/src/context/AppContext";
import { CustomMeal, NutritionPlan } from "@/src/types";

export default function Nutrition() {
  const { t, language, appData, setAppData, calculateBMR } = useApp();
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState<Partial<CustomMeal>>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const today = new Date().toISOString().split('T')[0];
  const dayData = appData.days[today] || { date: today, calories: 0, steps: 0, water: 0, meals: [] };
  
  const bmr = calculateBMR(appData.profile);
  const plan = appData.nutritionPlan;
  const ratios = plan.ratios;

  const [showRatioEditor, setShowRatioEditor] = useState(false);
  const [tempRatios, setTempRatios] = useState(ratios);

  // Macro calculation based on plan
  const getTargets = () => {
    let multiplier = 1.2; // Base activity
    if (plan.isTrainingDay) multiplier = 1.5;

    const totalCalories = appData.profile.customCalorieGoal || (bmr * multiplier);
    
    let p = 0.3, c = 0.4, f = 0.3;

    if (plan.type === 'standard') {
      p = ratios.standard.protein / 100;
      c = ratios.standard.carbs / 100;
      f = ratios.standard.fat / 100;
    } else if (plan.type === 'carb-cycling') {
      if (plan.isTrainingDay) {
        p = ratios.carbCycling.training.protein / 100;
        c = ratios.carbCycling.training.carbs / 100;
        f = ratios.carbCycling.training.fat / 100;
      } else {
        p = ratios.carbCycling.rest.protein / 100;
        c = ratios.carbCycling.rest.carbs / 100;
        f = ratios.carbCycling.rest.fat / 100;
      }
    } else if (plan.type === 'carb-tapering') {
      const phase = appData.phase || 1;
      // Interpolate between initial and final
      const initial = ratios.carbTapering.initial;
      const final = ratios.carbTapering.final;
      const progress = Math.min(1, (phase - 1) / 4); // Assume 5 phases
      p = (initial.protein + (final.protein - initial.protein) * progress) / 100;
      c = (initial.carbs + (final.carbs - initial.carbs) * progress) / 100;
      f = (initial.fat + (final.fat - initial.fat) * progress) / 100;
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round((totalCalories * p) / 4),
      carbs: Math.round((totalCalories * c) / 4),
      fat: Math.round((totalCalories * f) / 9)
    };
  };

  const targets = getTargets();
  const totals = (dayData.meals || []).reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleDeleteMeal = (mealId: string) => {
    setAppData({
      ...appData,
      days: {
        ...appData.days,
        [today]: {
          ...dayData,
          meals: dayData.meals.filter(m => m.id !== mealId)
        }
      }
    });
  };

  const handleClearAll = () => {
    if (!window.confirm(t("clearAll") + "?")) return;
    setAppData({
      ...appData,
      days: {
        ...appData.days,
        [today]: {
          ...dayData,
          meals: []
        }
      }
    });
  };

  const handleAddMeal = () => {
    if (!newMeal.name) return;
    const meal: CustomMeal = {
      id: Date.now().toString(),
      name: newMeal.name,
      calories: newMeal.calories || 0,
      protein: newMeal.protein || 0,
      carbs: newMeal.carbs || 0,
      fat: newMeal.fat || 0,
      time: newMeal.time || ""
    };

    setAppData({
      ...appData,
      days: {
        ...appData.days,
        [today]: {
          ...dayData,
          meals: [...(dayData.meals || []), meal]
        }
      }
    });
    setShowAddMeal(false);
    setNewMeal({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  };

  const copyToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowData = appData.days[tomorrowStr] || { date: tomorrowStr, calories: 0, steps: 0, water: 0, meals: [], workoutSessions: [] };
    
    setAppData({
      ...appData,
      days: {
        ...appData.days,
        [tomorrowStr]: {
          ...tomorrowData,
          meals: [...(tomorrowData.meals || []), ...dayData.meals]
        }
      }
    });
  };

  const updatePlan = (updates: Partial<NutritionPlan>) => {
    setAppData({
      ...appData,
      nutritionPlan: { ...plan, ...updates }
    });
  };

  const saveRatios = () => {
    setAppData({
      ...appData,
      nutritionPlan: { ...plan, ratios: tempRatios }
    });
    setShowRatioEditor(false);
  };

  return (
    <div className="space-y-6 pb-32 pt-8">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-3xl font-bold">{t("nutrition")}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRatioEditor(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setShowAddMeal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Ratio Editor Modal */}
      {showRatioEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80 dark:border-white/20 dark:bg-black/80 light:border-black/10 light:bg-white/90 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("macroRatios")}</h2>
              <button onClick={() => setShowRatioEditor(false)} className="text-white/40 hover:text-white dark:text-white/40 light:text-black/40">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("customCalorieGoal")}</label>
                <input 
                  type="number" 
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  value={appData.profile.customCalorieGoal || ""}
                  onChange={e => setAppData({
                    ...appData,
                    profile: { ...appData.profile, customCalorieGoal: Number(e.target.value) }
                  })}
                  placeholder="e.g. 2400"
                />
              </div>
              <div className="h-px bg-white/10" />
            </div>

            <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2 no-scrollbar">
              {/* Standard */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-blue-400">{t("standard")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['protein', 'carbs', 'fat'].map(macro => (
                    <div key={macro} className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t(macro as any)} (%)</label>
                      <input 
                        type="number" 
                        className="w-full rounded-xl bg-white/5 px-2 py-2 text-xs outline-none"
                        value={(tempRatios.standard as any)[macro]}
                        onChange={e => setTempRatios({...tempRatios, standard: {...tempRatios.standard, [macro]: Number(e.target.value)}})}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carb Cycling */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-orange-400">{t("carbCycling")}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20">{t("trainingRatios")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['protein', 'carbs', 'fat'].map(macro => (
                        <div key={macro} className="space-y-1">
                          <input 
                            type="number" 
                            className="w-full rounded-xl bg-white/5 px-2 py-2 text-xs outline-none"
                            value={(tempRatios.carbCycling.training as any)[macro]}
                            onChange={e => setTempRatios({...tempRatios, carbCycling: {...tempRatios.carbCycling, training: {...tempRatios.carbCycling.training, [macro]: Number(e.target.value)}}})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20">{t("restRatios")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['protein', 'carbs', 'fat'].map(macro => (
                        <div key={macro} className="space-y-1">
                          <input 
                            type="number" 
                            className="w-full rounded-xl bg-white/5 px-2 py-2 text-xs outline-none"
                            value={(tempRatios.carbCycling.rest as any)[macro]}
                            onChange={e => setTempRatios({...tempRatios, carbCycling: {...tempRatios.carbCycling, rest: {...tempRatios.carbCycling.rest, [macro]: Number(e.target.value)}}})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carb Tapering */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-purple-400">{t("carbTapering")}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20">{t("initialRatios")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['protein', 'carbs', 'fat'].map(macro => (
                        <div key={macro} className="space-y-1">
                          <input 
                            type="number" 
                            className="w-full rounded-xl bg-white/5 px-2 py-2 text-xs outline-none"
                            value={(tempRatios.carbTapering.initial as any)[macro]}
                            onChange={e => setTempRatios({...tempRatios, carbTapering: {...tempRatios.carbTapering, initial: {...tempRatios.carbTapering.initial, [macro]: Number(e.target.value)}}})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20">{t("finalRatios")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['protein', 'carbs', 'fat'].map(macro => (
                        <div key={macro} className="space-y-1">
                          <input 
                            type="number" 
                            className="w-full rounded-xl bg-white/5 px-2 py-2 text-xs outline-none"
                            value={(tempRatios.carbTapering.final as any)[macro]}
                            onChange={e => setTempRatios({...tempRatios, carbTapering: {...tempRatios.carbTapering, final: {...tempRatios.carbTapering.final, [macro]: Number(e.target.value)}}})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={saveRatios}
              className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-95 dark:bg-white dark:text-black light:bg-black light:text-white"
            >
              {t("save")}
            </button>
          </GlassCard>
        </div>
      )}

      {/* Plan Selection */}
      <div className="px-4">
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">{t("nutritionPlan")}</h2>
            <div className="flex gap-2">
              {(['standard', 'carb-cycling', 'carb-tapering'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => updatePlan({ type })}
                  className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase transition-all ${
                    plan.type === type ? "bg-white text-black" : "bg-white/5 text-white/40"
                  }`}
                >
                  {t(type as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.isTrainingDay ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
                {plan.isTrainingDay ? <Zap size={20} /> : <Calendar size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold">{plan.isTrainingDay ? t("trainingDay") : t("restDay")}</p>
                <p className="text-[10px] text-white/40">{targets.calories} kcal goal</p>
              </div>
            </div>
            <button 
              onClick={() => updatePlan({ isTrainingDay: !plan.isTrainingDay })}
              className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              Switch
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Macros Summary */}
      <div className="px-4">
        <GlassCard className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{t("calories")}</p>
              <h2 className="text-3xl font-bold">{totals.calories} <span className="text-sm font-normal text-white/20">/ {targets.calories}</span></h2>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/5">
              <PieChart size={24} className="text-green-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-white/40">{t("protein")}</span>
                <span>{totals.protein}g</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                  className="h-full bg-blue-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totals.protein / targets.protein) * 100)}%` }} 
                />
              </div>
              <p className="text-[10px] text-white/20 text-right">Goal: {targets.protein}g</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-white/40">{t("carbs")}</span>
                <span>{totals.carbs}g</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                  className="h-full bg-green-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totals.carbs / targets.carbs) * 100)}%` }} 
                />
              </div>
              <p className="text-[10px] text-white/20 text-right">Goal: {targets.carbs}g</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-white/40">{t("fat")}</span>
                <span>{totals.fat}g</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totals.fat / targets.fat) * 100)}%` }} 
                />
              </div>
              <p className="text-[10px] text-white/20 text-right">Goal: {targets.fat}g</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Meals List */}
      <div className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("todaysMeals")}</h2>
          <div className="flex gap-2">
            {dayData.meals && dayData.meals.length > 0 && (
              <>
                <button 
                  onClick={handleClearAll}
                  className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <X size={14} />
                  {t("clearAll")}
                </button>
                <button 
                  onClick={copyToTomorrow}
                  className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Calendar size={14} />
                  {t("copyToTomorrow")}
                </button>
              </>
            )}
          </div>
        </div>
        {(!dayData.meals || dayData.meals.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <Utensils size={48} strokeWidth={1} />
            <p className="mt-4 text-sm">No meals logged yet</p>
          </div>
        ) : (
          dayData.meals.map((meal) => (
            <GlassCard key={meal.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-green-400">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{meal.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock size={12} />
                    <span>{meal.time}</span>
                    <span>•</span>
                    <span>{meal.calories} kcal</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteMeal(meal.id)}
                className="p-2 text-white/20 hover:text-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            </GlassCard>
          ))
        )}
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("customMeal")}</h2>
              <button onClick={() => setShowAddMeal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("mealName")}</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                  value={newMeal.name}
                  onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("calories")}</label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                    value={newMeal.calories || ""}
                    onChange={e => setNewMeal({...newMeal, calories: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("time")}</label>
                  <input 
                    type="time" 
                    className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                    value={newMeal.time}
                    onChange={e => setNewMeal({...newMeal, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("protein")}</label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                    value={newMeal.protein || ""}
                    onChange={e => setNewMeal({...newMeal, protein: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("carbs")}</label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                    value={newMeal.carbs || ""}
                    onChange={e => setNewMeal({...newMeal, carbs: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("fat")}</label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-green-500/50"
                    value={newMeal.fat || ""}
                    onChange={e => setNewMeal({...newMeal, fat: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddMeal}
              className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-transform active:scale-95"
            >
              {t("save")}
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
