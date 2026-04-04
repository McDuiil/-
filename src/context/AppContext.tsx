import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, AppData, Profile } from '../types';
import { translations } from '../lib/i18n';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: keyof typeof translations.en) => string;
  appData: AppData;
  setAppData: (data: AppData) => void;
  calculateBMR: (profile: Profile) => number;
  mergeData: (incomingData: AppData) => void;
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
  enabledWidgets: ['calories', 'deficit', 'activity', 'water', 'quickWorkout', 'quickMeal'],
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem('utopia_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration for new fields
      if (!parsed.profile.nickname) parsed.profile.nickname = defaultProfile.nickname;
      if (!parsed.profile.avatar) parsed.profile.avatar = defaultProfile.avatar;
      if (!parsed.nutritionPlan.ratios) parsed.nutritionPlan.ratios = initialData.nutritionPlan.ratios;
      if (!parsed.customExercises) parsed.customExercises = [];
      if (!parsed.enabledWidgets) parsed.enabledWidgets = initialData.enabledWidgets;
      if (!parsed.categoryImages) parsed.categoryImages = initialData.categoryImages;
      if (!parsed.syncSettings) parsed.syncSettings = initialData.syncSettings;
      return parsed as AppData;
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

  const mergeData = (incomingData: AppData) => {
    setAppData(prev => {
      // If current device is PC, merge incoming data (from Mobile)
      if (prev.syncSettings.mode === 'pc') {
        const mergedDays = { ...prev.days };
        
        Object.entries(incomingData.days).forEach(([date, dayData]) => {
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
              water: Math.max(mergedDays[date].water, dayData.water),
              steps: Math.max(mergedDays[date].steps, dayData.steps)
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
          ...incomingData,
          syncSettings: {
            ...prev.syncSettings, // Keep local sync mode
            lastSync: new Date().toISOString()
          }
        };
      }
    });
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, t, appData, setAppData, calculateBMR, mergeData }}>
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
