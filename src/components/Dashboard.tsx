import React, { useState } from "react";
import { Activity, Flame, Footprints, Droplets, Plus, Play, Utensils, Settings, X, Check } from "lucide-react";
import GlassCard from "./GlassCard";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useApp } from "@/src/context/AppContext";

export default function Dashboard() {
  const { t, appData, language, calculateBMR, setAppData } = useApp();
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const dayData = appData.days[today] || { date: today, calories: 0, steps: 0, water: 0, meals: [], workoutSessions: [] };

  const bmr = calculateBMR(appData.profile);
  const mealCalories = (dayData.meals || []).reduce((sum, m) => sum + (m.calories || 0), 0);
  const workoutCalories = (dayData.workoutSessions || []).reduce((sum, s) => sum + (s.calories || 0), 0);
  
  const totalBurned = bmr + workoutCalories;
  const netCalories = mealCalories - totalBurned;
  const dailyDeficit = totalBurned - mealCalories;

  const chartData = [
    { time: "6am", calories: 120 },
    { time: "9am", calories: 340 },
    { time: "12pm", calories: 680 },
    { time: "3pm", calories: 890 },
    { time: "6pm", calories: 1240 },
    { time: "9pm", calories: mealCalories || 1420 },
  ];

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', options).format(new Date());
  };

  const getTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour < 10) return t("breakfast");
    if (hour < 14) return t("lunch");
    if (hour < 19) return t("dinner");
    return t("snack");
  };

  const handleQuickLogMeal = () => {
    const meal = {
      id: Date.now().toString(),
      name: getTimeSlot(),
      calories: 400,
      protein: 20,
      carbs: 50,
      fat: 10,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  };

  const toggleWidget = (id: string) => {
    const enabled = appData.enabledWidgets || [];
    const newWidgets = enabled.includes(id) 
      ? enabled.filter(w => w !== id)
      : [...enabled, id];
    setAppData({ ...appData, enabledWidgets: newWidgets });
  };

  const isEnabled = (id: string) => (appData.enabledWidgets || []).includes(id);

  const calorieGoal = appData.profile.customCalorieGoal || 2400;

  return (
    <div className="space-y-6 pb-32 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("today")}</h1>
          <p className="text-white/40 dark:text-white/40 light:text-black/40">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWidgetManager(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings size={20} />
          </button>
          <div className="h-12 w-12 rounded-full border border-white/20 bg-white/10 p-1 dark:border-white/20 dark:bg-white/10 light:border-black/10 light:bg-black/5">
            <img
              src={appData.profile.avatar}
              alt="Avatar"
              className="h-full w-full rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Widgets Row */}
      <div className="grid grid-cols-2 gap-4 px-4">
        {isEnabled('quickWorkout') && (
          <GlassCard 
            className="flex flex-col justify-between p-4 aspect-square cursor-pointer active:scale-95 transition-transform bg-blue-500/10 border-blue-500/20"
            onClick={() => (window as any).setTab?.('workouts')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("quickStart")}</h3>
              <p className="text-[10px] text-white/40 dark:text-white/40 light:text-black/40">{t("workouts")}</p>
            </div>
          </GlassCard>
        )}

        {isEnabled('quickMeal') && (
          <GlassCard 
            className="flex flex-col justify-between p-4 aspect-square cursor-pointer active:scale-95 transition-transform bg-green-500/10 border-green-500/20"
            onClick={handleQuickLogMeal}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/30">
              <Utensils size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("quickLog")}</h3>
              <p className="text-[10px] text-white/40 dark:text-white/40 light:text-black/40">{getTimeSlot()}</p>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
        {isEnabled('calories') && (
          <GlassCard className="flex flex-col gap-2 border-orange-500/20 bg-orange-500/5" delay={0.1}>
            <div className="flex items-center gap-2 text-orange-400">
              <Flame size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t("calories")}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{mealCalories}</span>
              <span className="text-xs text-white/40 dark:text-white/40 light:text-black/40">kcal</span>
            </div>
            <p className="text-[10px] text-white/40 dark:text-white/40 light:text-black/40">Net: {netCalories > 0 ? "+" : ""}{Math.round(netCalories)} kcal</p>
            <div className="h-1 w-full rounded-full bg-white/10 dark:bg-white/10 light:bg-black/5">
              <div 
                className="h-full rounded-full bg-orange-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (mealCalories / calorieGoal) * 100)}%` }}
              />
            </div>
          </GlassCard>
        )}

        {isEnabled('deficit') && (
          <GlassCard className="flex flex-col gap-2 border-blue-500/20 bg-blue-500/5" delay={0.2}>
            <div className="flex items-center gap-2 text-blue-400">
              <Activity size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t("dailyDeficit")}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{Math.round(dailyDeficit)}</span>
              <span className="text-xs text-white/40 dark:text-white/40 light:text-black/40">kcal</span>
            </div>
            <p className="text-[10px] text-white/40 dark:text-white/40 light:text-black/40">Goal: {appData.profile.goalDeficit} kcal</p>
            <div className="h-1 w-full rounded-full bg-white/10 dark:bg-white/10 light:bg-black/5">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (dailyDeficit / appData.profile.goalDeficit) * 100)}%` }}
              />
            </div>
          </GlassCard>
        )}
      </div>

      {/* Activity Chart */}
      {isEnabled('activity') && (
        <div className="px-4">
          <GlassCard className="h-[300px]" delay={0.3}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <Activity size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t("activity")}</span>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorCal)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Water Intake */}
      {isEnabled('water') && (
        <div className="px-4">
          <GlassCard className="flex items-center justify-between" delay={0.4}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                <Droplets size={24} />
              </div>
              <div>
                <h3 className="font-semibold">{t("waterIntake")}</h3>
                <p className="text-xs text-white/40 dark:text-white/40 light:text-black/40">1.8L / 2.5L</p>
              </div>
            </div>
            <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold transition-colors hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 light:bg-black/5 light:hover:bg-black/10">
              + {t("add")}
            </button>
          </GlassCard>
        </div>
      )}

      {/* Widget Manager Modal */}
      {showWidgetManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("manageWidgets")}</h2>
              <button onClick={() => setShowWidgetManager(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'calories', label: t("calories") },
                { id: 'deficit', label: t("deficitWidget") },
                { id: 'activity', label: t("activityWidget") },
                { id: 'water', label: t("waterWidget") },
                { id: 'quickWorkout', label: t("quickWorkoutWidget") },
                { id: 'quickMeal', label: t("quickMealWidget") },
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                    isEnabled(w.id) ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40"
                  }`}
                >
                  <span className="font-bold">{w.label}</span>
                  {isEnabled(w.id) && <Check size={18} />}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowWidgetManager(false)}
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
