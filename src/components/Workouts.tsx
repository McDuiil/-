import React, { useState, useMemo } from "react";
import { Search, Play, Plus, Clock, X, Check, Award, Settings, ChevronRight, History as HistoryIcon, Dumbbell, Flame } from "lucide-react";
import GlassCard from "./GlassCard";
import { useApp } from "@/src/context/AppContext";
import { Exercise, WorkoutSession, WorkoutSessionExercise, DayData } from "@/src/types";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayStr } from "../lib/utils";

const EXERCISES: Exercise[] = [
  { id: '1', name: { en: 'Bench Press', zh: '卧推' }, part: 'chest', equipment: 'Barbell', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=60' },
  { id: '2', name: { en: 'Squat', zh: '深蹲' }, part: 'legs', equipment: 'Barbell', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=60' },
  { id: '3', name: { en: 'Deadlift', zh: '硬拉' }, part: 'back', equipment: 'Barbell', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&auto=format&fit=crop&q=60' },
  { id: '4', name: { en: 'Shoulder Press', zh: '推肩' }, part: 'shoulders', equipment: 'Dumbbell', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=60' },
  { id: '5', name: { en: 'Pull Up', zh: '引体向上' }, part: 'back', equipment: 'Bodyweight', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60' },
  { id: '6', name: { en: 'Bicep Curl', zh: '二头弯举' }, part: 'arms', equipment: 'Dumbbell', image: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=400&auto=format&fit=crop&q=60' },
];

export default function Workouts() {
  const { t, language, appData, setAppData } = useApp();
  const [activeTab, setActiveTab] = useState<'records' | 'library'>('records');
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: { en: "", zh: "" },
    part: 'chest',
    equipment: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=400&auto=format&fit=crop&q=60'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const allExercises = [...EXERCISES, ...(appData.customExercises || [])];

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name[language].toLowerCase().includes(search.toLowerCase()) || ex.name.en.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || ex.part === filter;
    return matchesSearch && matchesFilter;
  });

  // Get all workout history across all days
  const workoutHistory = useMemo(() => {
    const history: { date: string; session: WorkoutSession }[] = [];
    Object.entries(appData.days).forEach(([date, day]) => {
      const dayData = day as DayData;
      if (dayData.workoutSessions) {
        dayData.workoutSessions.forEach(session => {
          history.push({ date, session });
        });
      }
    });
    return history.sort((a, b) => new Date(b.session.startTime).getTime() - new Date(a.session.startTime).getTime());
  }, [appData.days]);

  const startSession = (category?: string) => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      exercises: [],
      calories: 0,
      category: category
    };
    setActiveSession(newSession);
    setShowCategoryPicker(false);
  };

  const addExerciseToSession = (ex: Exercise) => {
    if (!activeSession) return;
    const sessionEx: WorkoutSessionExercise = {
      exerciseId: ex.id,
      name: ex.name[language],
      sets: [{ reps: 0, weight: 0, isPR: false }]
    };
    setActiveSession({
      ...activeSession,
      exercises: [...activeSession.exercises, sessionEx]
    });
    setShowExercisePicker(false);
  };

  const handleAddCustomExercise = () => {
    if (!newExercise.name?.zh) return;
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: { en: newExercise.name.en || newExercise.name.zh, zh: newExercise.name.zh },
      part: newExercise.part || 'chest',
      equipment: newExercise.equipment || 'Dumbbell',
      image: newExercise.image || 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=400&auto=format&fit=crop&q=60'
    };

    setAppData({
      ...appData,
      customExercises: [...(appData.customExercises || []), exercise]
    });
    setShowCustomExerciseModal(false);
    setNewExercise({ name: { en: "", zh: "" }, part: 'chest', equipment: 'Dumbbell', image: '' });
  };

  const updateSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight' | 'isPR', value: any) => {
    if (!activeSession) return;
    const newExercises = [...activeSession.exercises];
    newExercises[exIndex].sets[setIndex] = {
      ...newExercises[exIndex].sets[setIndex],
      [field]: value
    };
    setActiveSession({ ...activeSession, exercises: newExercises });
  };

  const addSet = (exIndex: number) => {
    if (!activeSession) return;
    const newExercises = [...activeSession.exercises];
    const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1];
    newExercises[exIndex].sets.push({ ...lastSet, isPR: false });
    setActiveSession({ ...activeSession, exercises: newExercises });
  };

  const finishSession = () => {
    if (!activeSession) return;
    const today = getTodayStr();
    const dayData = appData.days[today] || { date: today, calories: 0, steps: 0, water: 0, meals: [], workoutSessions: [] };
    
    const finishedSession = {
      ...activeSession,
      endTime: new Date().toISOString()
    };

    setAppData({
      ...appData,
      days: {
        ...appData.days,
        [today]: {
          ...dayData,
          workoutSessions: [...(dayData.workoutSessions || []), finishedSession]
        }
      }
    });
    setActiveSession(null);
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.floor(diff / 60000);
  };

  return (
    <div className="min-h-screen space-y-6 pb-32 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("workouts")}</h1>
        {!activeSession && (
          <button 
            onClick={() => setShowCategoryPicker(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      {!activeSession && (
        <div className="px-4">
          <div className="flex rounded-2xl bg-white/5 p-1">
            <button 
              onClick={() => setActiveTab('records')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab === 'records' ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}
            >
              <HistoryIcon size={16} />
              {t("trainingRecords")}
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}
            >
              <Dumbbell size={16} />
              {t("actionLibrary")}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GlassCard className="space-y-6 border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Clock size={18} />
                      <span className="text-sm font-bold">
                        {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {activeSession.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {t(activeSession.category as any)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-orange-400" />
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-16 rounded-lg bg-white/5 px-2 py-1 text-right text-sm font-bold outline-none ring-1 ring-white/10"
                      value={activeSession.calories || ""}
                      onChange={e => setActiveSession({...activeSession, calories: Number(e.target.value)})}
                    />
                    <span className="text-xs text-white/40">kcal</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeSession.exercises.map((sessionEx, exIdx) => {
                    const exercise = allExercises.find(e => e.id === sessionEx.exerciseId);
                    return (
                      <div key={exIdx} className="space-y-3 rounded-2xl bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold">{exercise?.name[language]}</h3>
                          <button 
                            onClick={() => {
                              const newExs = activeSession.exercises.filter((_, i) => i !== exIdx);
                              setActiveSession({...activeSession, exercises: newExs});
                            }}
                            className="text-white/20 hover:text-red-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                            <span className="text-center">Set</span>
                            <span className="text-center">kg</span>
                            <span className="text-center">Reps</span>
                            <span className="text-center">PR</span>
                          </div>
                          {sessionEx.sets.map((set, setIdx) => (
                            <div key={setIdx} className="grid grid-cols-4 items-center gap-2">
                              <span className="text-center text-xs font-bold text-white/20">{setIdx + 1}</span>
                              <input 
                                type="number" 
                                className="rounded-lg bg-white/10 px-2 py-1.5 text-center text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                value={set.weight || ""}
                                onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                              />
                              <input 
                                type="number" 
                                className="rounded-lg bg-white/10 px-2 py-1.5 text-center text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                value={set.reps || ""}
                                onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                              />
                              <button 
                                onClick={() => updateSet(exIdx, setIdx, 'isPR', !set.isPR)}
                                className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg transition-colors ${set.isPR ? "bg-yellow-500 text-black" : "bg-white/5 text-white/20"}`}
                              >
                                <Award size={16} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => addSet(exIdx)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-white/40 hover:bg-white/5"
                          >
                            <Plus size={14} />
                            {t("sets")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowExercisePicker(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold transition-colors hover:bg-white/20"
                  >
                    <Plus size={20} />
                    {t("addExercise")}
                  </button>
                  <button 
                    onClick={finishSession}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 font-bold text-white shadow-lg shadow-green-500/20 transition-transform active:scale-95"
                  >
                    <Check size={20} />
                    {t("endWorkout")}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ) : activeTab === 'records' ? (
            <motion.div 
              key="records"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {workoutHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <HistoryIcon size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-medium">{t("noRecords")}</p>
                  <button 
                    onClick={() => setShowCategoryPicker(true)}
                    className="mt-6 rounded-full bg-blue-500/10 px-6 py-2 text-sm font-bold text-blue-400"
                  >
                    {t("startNewWorkout")}
                  </button>
                </div>
              ) : (
                workoutHistory.map(({ date, session }, idx) => (
                  <GlassCard key={session.id} className="p-4" delay={idx * 0.05}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <Dumbbell size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold">{session.category ? t(session.category as any) : t("workouts")}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-400">{session.calories} kcal</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {calculateDuration(session.startTime, session.endTime)} {t("min")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      {session.exercises.slice(0, 3).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-white/60">
                          <span>{ex.name}</span>
                          <span className="text-white/40">{ex.sets.length} {t("sets")}</span>
                        </div>
                      ))}
                      {session.exercises.length > 3 && (
                        <p className="text-[10px] text-white/20">+{session.exercises.length - 3} more exercises</p>
                      )}
                    </div>
                  </GlassCard>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder={t("actionLibrary")}
                  className="w-full rounded-2xl bg-white/5 py-4 pl-12 pr-4 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'].map((part) => (
                  <button
                    key={part}
                    onClick={() => setFilter(part)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      filter === part ? "bg-white text-black" : "bg-white/5 text-white/40"
                    }`}
                  >
                    {t(part as any)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredExercises.map((ex, index) => (
                  <GlassCard key={ex.id} className="overflow-hidden p-0" delay={index * 0.05}>
                    <div className="relative aspect-[4/3]">
                      <img
                        src={ex.image}
                        alt={ex.name[language]}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">{t(ex.part as any)}</p>
                        <h3 className="font-bold text-sm">{ex.name[language]}</h3>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
              
              <button 
                onClick={() => setShowCustomExerciseModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-4 text-sm font-bold text-white/40 hover:bg-white/5"
              >
                <Plus size={18} />
                {t("customExercise")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("workoutCategory")}</h2>
              <button onClick={() => setShowCategoryPicker(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['chest', 'back', 'legs', 'shoulders', 'arms', 'core'].map(cat => (
                <div key={cat} className="relative group">
                  <button
                    onClick={() => startSession(cat)}
                    className="w-full rounded-2xl bg-white/5 p-4 text-center font-bold transition-all hover:bg-white/10 active:scale-95"
                  >
                    {t(cat as any)}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCategoryEditor(cat);
                    }}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => startSession()}
                className="col-span-2 rounded-2xl bg-white/10 p-4 text-center font-bold transition-all hover:bg-white/20 active:scale-95"
              >
                {t("all")}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Exercise Picker Modal (During Session) */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 pt-12 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("addExercise")}</h2>
            <button onClick={() => setShowExercisePicker(false)} className="rounded-full bg-white/10 p-2">
              <X size={20} />
            </button>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder={t("actionLibrary")}
              className="w-full rounded-2xl bg-white/5 py-4 pl-12 pr-4 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            {filteredExercises.map((ex) => (
              <GlassCard 
                key={ex.id} 
                className="flex items-center gap-4 p-3 cursor-pointer hover:bg-white/10"
                onClick={() => addExerciseToSession(ex)}
              >
                <img src={ex.image} alt={ex.name[language]} className="h-16 w-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <h3 className="font-bold">{ex.name[language]}</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{t(ex.part as any)} • {ex.equipment}</p>
                </div>
                <Plus size={20} className="text-blue-400" />
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Custom Exercise Modal */}
      {showCustomExerciseModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("customExercise")}</h2>
              <button onClick={() => setShowCustomExerciseModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("exerciseName")}</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  value={newExercise.name?.zh}
                  onChange={e => setNewExercise({...newExercise, name: { en: e.target.value, zh: e.target.value }})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("exerciseImage")}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-xl bg-white/5 px-4 py-3 outline-none"
                    value={newExercise.image}
                    onChange={e => setNewExercise({...newExercise, image: e.target.value})}
                    placeholder="URL"
                  />
                  <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                    <Plus size={20} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={e => handleFileUpload(e, (url) => setNewExercise({...newExercise, image: url}))}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("filterByPart")}</label>
                  <select 
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none"
                    value={newExercise.part}
                    onChange={e => setNewExercise({...newExercise, part: e.target.value as any})}
                  >
                    {['chest', 'back', 'legs', 'shoulders', 'arms', 'core'].map(p => (
                      <option key={p} value={p}>{t(p as any)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Equipment</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none"
                    value={newExercise.equipment}
                    onChange={e => setNewExercise({...newExercise, equipment: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddCustomExercise}
              className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-transform active:scale-95"
            >
              {t("save")}
            </button>
          </GlassCard>
        </div>
      )}

      {/* Category Editor Modal */}
      {showCategoryEditor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("editCategory")}: {t(showCategoryEditor as any)}</h2>
              <button onClick={() => setShowCategoryEditor(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("categoryImage")}</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  value={appData.categoryImages[showCategoryEditor]}
                  onChange={e => setAppData({
                    ...appData,
                    categoryImages: { ...appData.categoryImages, [showCategoryEditor]: e.target.value }
                  })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold hover:bg-white/20">
                  <Plus size={16} />
                  {t("uploadLocal")}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={e => handleFileUpload(e, (url) => {
                      setAppData({
                        ...appData,
                        categoryImages: { ...appData.categoryImages, [showCategoryEditor]: url }
                      });
                    })}
                  />
                </label>
              </div>
            </div>
            <button 
              onClick={() => setShowCategoryEditor(null)}
              className="w-full rounded-2xl bg-white py-4 font-bold text-black"
            >
              {t("save")}
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
