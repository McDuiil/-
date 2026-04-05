import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, AppData, Profile, DayData, CustomMeal, WorkoutSession } from '../types';
import { translations } from '../lib/i18n';
import { githubService } from '../services/githubService';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: keyof typeof translations.en) => string;
  appData: AppData;
  setAppData: (data: AppData) => void;
  calculateBMR: (profile: Profile) => number;
  mergeData: (incomingData: any) => void;
  syncWithGist: (silent?: boolean) => Promise<void>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const defaultProfile: Profile = {
  nickname: "Utopia User",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  gender: "male",
  age: 30,
  height: 170,
  weight: 64,
  bodyFat: 17.2,
  goalWeight: 63,
  goalDeficit: 500,
  goalBodyFat: 9,
  useCustomBMR: false,
  customBMR: 1558
};

const initialData: AppData = {
  version: 4,
  phase: 1,
  mode: "train",
  profile: defaultProfile,
  nutritionPlan: {
    type: 'standard',
    isTrainingDay: true,
    ratios: {
      standard: { protein: 30, carbs: 40, fat: 30 },
      carbCycling: {
        training: { protein: 25, carbs: 60, fat: 15 },
        rest: { protein: 40, carbs: 20, fat: 40 }
      },
      carbTapering: {
        initial: { protein: 40, carbs: 50, fat: 10 },
        final: { protein: 40, carbs: 10, fat: 50 }
      }
    }
  },
  days: {},
  customExercises: [],
  enabledWidgets: ['weight', 'calories', 'deficit', 'activity', 'water', 'quickWorkout', 'quickMeal'],
  categoryImages: {
    chest: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=60',
    back: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&auto=format&fit=crop&q=60',
    legs: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=60',
    shoulders: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=60',
    arms: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=400&auto=format&fit=crop&q=60',
    core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60'
  },
  syncSettings: {
    mode: 'pc'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const migrateData = (data: any): AppData => {
  console.log("Migrating data from version:", data.version || 1);
  const parsed = { ...data };
  
  // 1. Profile Migration
  if (!parsed.profile) parsed.profile = { ...defaultProfile };
  if (!parsed.profile.nickname) parsed.profile.nickname = defaultProfile.nickname;
  if (!parsed.profile.avatar) parsed.profile.avatar = defaultProfile.avatar;
  if (parsed.profile.useCustom !== undefined) {
    parsed.profile.useCustomBMR = parsed.profile.useCustom;
    delete parsed.profile.useCustom;
  }
  if (parsed.profile.useCustomBMR === undefined) parsed.profile.useCustomBMR = false;
  if (parsed.profile.customBMR === null || parsed.profile.customBMR === undefined) parsed.profile.customBMR = 1558;

  // 2. Nutrition Plan Migration
  if (!parsed.nutritionPlan) {
    parsed.nutritionPlan = { ...initialData.nutritionPlan };
  }
  if (!parsed.nutritionPlan.ratios) {
    parsed.nutritionPlan.ratios = initialData.nutritionPlan.ratios;
  }

  // 3. Days Data Migration (Version 2 to 4)
  const migratedDays: { [date: string]: DayData } = {};
  if (parsed.days) {
    Object.entries(parsed.days).forEach(([date, day]: [string, any]) => {
      // Check if it's already in version 4 format
      if (Array.isArray(day.meals) && Array.isArray(day.workoutSessions)) {
        migratedDays[date] = day;
      } else {
        // Convert version 2 format
        const meals: CustomMeal[] = [];
        if (day.customMeals && day.customMeals._mealList) {
          day.customMeals._mealList.forEach((m: any, idx: number) => {
            meals.push({
              id: `legacy-${date}-${idx}`,
              name: m.n || 'Meal',
              calories: m.k || 0,
              protein: m.p || 0,
              carbs: m.c || 0,
              fat: m.f || 0,
              time: m.t || '00:00'
            });
          });
        }

        const workoutSessions: WorkoutSession[] = [];
        if (day.ps) { // If there was a workout part
          workoutSessions.push({
            id: `legacy-workout-${date}`,
            startTime: '00:00',
            exercises: [],
            calories: day.s || 0, // Assuming 's' was strength/workout calories
            category: day.ps
          });
        }

        migratedDays[date] = {
          date,
          calories: day.c || 0, // In v2, 'c' might have been intake or cardio
          steps: day.steps || 0,
          water: day.water || 0,
          weight: day.w || undefined, // Version 2 used 'w' for weight
          meals,
          workoutSessions
        };
        console.log(`Migrated day ${date}: weight = ${migratedDays[date].weight}`);
      }
    });
  }
  parsed.days = migratedDays;

  // 4. Other Fields
  if (!parsed.customExercises) parsed.customExercises = [];
  if (!parsed.enabledWidgets) parsed.enabledWidgets = initialData.enabledWidgets;
  if (!parsed.categoryImages) parsed.categoryImages = initialData.categoryImages;
  if (!parsed.syncSettings) parsed.syncSettings = initialData.syncSettings;
  if (!parsed.phase) parsed.phase = 1;
  if (!parsed.mode) parsed.mode = 'train';
  
  parsed.version = 4; // Mark as migrated
  return parsed as AppData;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem('utopia_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return migrateData(parsed);
      } catch (e) {
        console.error("Failed to parse or migrate data:", e);
        return initialData;
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('utopia_data', JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const calculateBMR = (profile: Profile) => {
    if (profile.useCustomBMR) return profile.customBMR;
    // Mifflin-St Jeor Equation
    const { gender, age, height, weight } = profile;
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || key;
  };

  const mergeData = (incomingData: any) => {
    console.log("Merging incoming data. Incoming version:", incomingData.version || 1);
    const migratedIncoming = migrateData(incomingData);
    setAppData(prev => {
      // If current device is PC, merge incoming data (from Mobile)
      if (prev.syncSettings.mode === 'pc') {
        const mergedDays = { ...prev.days };
        
        Object.entries(migratedIncoming.days).forEach(([date, dayData]) => {
          if (!mergedDays[date]) {
            mergedDays[date] = dayData;
          } else {
            // Merge meals by ID
            const existingMealIds = new Set(mergedDays[date].meals.map(m => m.id));
            const newMeals = dayData.meals.filter(m => !existingMealIds.has(m.id));
            
            // Merge workouts by ID
            const existingWorkoutIds = new Set(mergedDays[date].workoutSessions.map(w => w.id));
            const newWorkouts = dayData.workoutSessions.filter(w => !existingWorkoutIds.has(w.id));

            mergedDays[date] = {
              ...mergedDays[date],
              meals: [...mergedDays[date].meals, ...newMeals],
              workoutSessions: [...mergedDays[date].workoutSessions, ...newWorkouts],
              water: Math.max(mergedDays[date].water, dayData.water || 0),
              steps: Math.max(mergedDays[date].steps, dayData.steps || 0),
              weight: dayData.weight || mergedDays[date].weight
            };
          }
        });

        return {
          ...prev,
          days: mergedDays,
          syncSettings: {
            ...prev.syncSettings,
            lastSync: new Date().toISOString()
          }
        };
      } else {
        // If current device is Mobile, overwrite with incoming data (from PC)
        return {
          ...migratedIncoming,
          syncSettings: {
            ...prev.syncSettings, // Keep local sync mode
            lastSync: new Date().toISOString()
          }
        };
      }
    });
  };

  const syncWithGist = async (silent: boolean = false) => {
    const { githubToken, gistId, mode } = appData.syncSettings;
    if (!githubToken) {
      if (!silent) alert(t('enterToken'));
      return;
    }

    try {
      let currentGistId = gistId;
      let remoteData: AppData | null = null;

      if (!currentGistId) {
        if (silent) return; // Don't auto-create Gist
        // Create new Gist if not exists
        const newGistId = await githubService.createGist(githubToken, appData);
        if (newGistId) {
          currentGistId = newGistId;
          setAppData(prev => ({
            ...prev,
            syncSettings: { ...prev.syncSettings, gistId: newGistId }
          }));
          alert(t('gistCreateSuccess'));
        } else {
          throw new Error('Gist creation failed');
        }
      } else {
        // Fetch existing Gist
        remoteData = await githubService.fetchGist(githubToken, currentGistId);
      }

      if (remoteData) {
        const migratedRemote = migrateData(remoteData);
        // Merge Logic
        if (mode === 'pc') {
          // PC Master: Pull remote (mobile inputs) -> Merge -> Push back
          const mergedDays = { ...appData.days };
          Object.entries(migratedRemote.days).forEach(([date, dayData]) => {
            const remoteDay = dayData as any;
            if (!mergedDays[date]) {
              mergedDays[date] = remoteDay;
            } else {
              const existingMealIds = new Set(mergedDays[date].meals.map(m => m.id));
              const newMeals = remoteDay.meals.filter((m: any) => !existingMealIds.has(m.id));
              const existingWorkoutIds = new Set(mergedDays[date].workoutSessions.map(w => w.id));
              const newWorkouts = remoteDay.workoutSessions.filter((w: any) => !existingWorkoutIds.has(w.id));

              mergedDays[date] = {
                ...mergedDays[date],
                meals: [...mergedDays[date].meals, ...newMeals],
                workoutSessions: [...mergedDays[date].workoutSessions, ...newWorkouts],
                water: Math.max(mergedDays[date].water, remoteDay.water || 0),
                steps: Math.max(mergedDays[date].steps, remoteDay.steps || 0),
                weight: remoteDay.weight || mergedDays[date].weight
              };
            }
          });

          const updatedData = {
            ...appData,
            days: mergedDays,
            syncSettings: { ...appData.syncSettings, lastSync: new Date().toISOString() }
          };

          const success = await githubService.updateGist(githubToken, currentGistId, updatedData);
          if (success) {
            setAppData(updatedData);
            if (!silent) alert(t('gistSyncSuccess'));
          } else {
            throw new Error('Gist update failed');
          }
        } else {
          // Mobile Input: Pull remote (PC master) -> Append local new items -> Push back
          const mergedDays = { ...migratedRemote.days };
          Object.entries(appData.days).forEach(([date, dayData]) => {
            const localDay = dayData as any;
            if (!mergedDays[date]) {
              mergedDays[date] = localDay;
            } else {
              const existingMealIds = new Set(mergedDays[date].meals.map(m => m.id));
              const newMeals = localDay.meals.filter((m: any) => !existingMealIds.has(m.id));
              const existingWorkoutIds = new Set(mergedDays[date].workoutSessions.map(w => w.id));
              const newWorkouts = localDay.workoutSessions.filter((w: any) => !existingWorkoutIds.has(w.id));

              mergedDays[date] = {
                ...mergedDays[date],
                meals: [...mergedDays[date].meals, ...newMeals],
                workoutSessions: [...mergedDays[date].workoutSessions, ...newWorkouts],
                water: Math.max(mergedDays[date].water, localDay.water || 0),
                steps: Math.max(mergedDays[date].steps, localDay.steps || 0),
                weight: localDay.weight || mergedDays[date].weight
              };
            }
          });

          const updatedData = {
            ...migratedRemote,
            days: mergedDays,
            syncSettings: { ...appData.syncSettings, lastSync: new Date().toISOString() }
          };

          const success = await githubService.updateGist(githubToken, currentGistId, updatedData);
          if (success) {
            setAppData(updatedData);
            if (!silent) alert(t('gistSyncSuccess'));
          } else {
            throw new Error('Gist update failed');
          }
        }
      }
    } catch (error) {
      console.error('Gist Sync Error:', error);
      if (!silent) alert(t('gistSyncError'));
    }
  };

  // Automatic Sync Logic
  useEffect(() => {
    const { githubToken, gistId } = appData.syncSettings;
    if (githubToken && gistId) {
      // 1. Auto-Pull on mount
      syncWithGist(true);

      // 2. Auto-Push on visibility change (when user leaves the app)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          syncWithGist(true);
        } else if (document.visibilityState === 'visible') {
          // Auto-Pull when returning to app
          syncWithGist(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [appData.syncSettings.githubToken, appData.syncSettings.gistId]);

  return (
    <AppContext.Provider value={{ 
      language, setLanguage, theme, setTheme, t, appData, setAppData, calculateBMR, mergeData, syncWithGist,
      selectedDate, setSelectedDate, activeTab, setActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
