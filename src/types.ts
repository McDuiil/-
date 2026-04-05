export type Language = 'en' | 'zh';
export type Theme = 'dark' | 'light';

export interface Profile {
  nickname: string;
  avatar: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  bodyFat: number;
  goalWeight: number;
  goalDeficit: number;
  goalBodyFat: number;
  useCustomBMR: boolean;
  customBMR: number;
  customCalorieGoal?: number;
}

export interface Ingredient {
  n: string; // name
  a: string; // amount
}

export interface CustomMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  isPR: boolean;
}

export interface WorkoutSessionExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  startTime: string;
  endTime?: string;
  exercises: WorkoutSessionExercise[];
  calories: number;
  category?: string;
}

export interface MacroRatio {
  protein: number; // percentage (0-100)
  carbs: number;
  fat: number;
}

export interface NutritionPlan {
  type: 'standard' | 'carb-cycling' | 'carb-tapering';
  currentPhase?: number;
  isTrainingDay: boolean;
  ratios: {
    standard: MacroRatio;
    carbCycling: {
      training: MacroRatio;
      rest: MacroRatio;
    };
    carbTapering: {
      initial: MacroRatio;
      final: MacroRatio;
    };
  };
}

export interface DayData {
  date: string;
  calories: number;
  steps: number;
  water: number;
  weight?: number;
  meals: CustomMeal[];
  workoutSessions: WorkoutSession[];
}

export interface SyncSettings {
  mode: 'pc' | 'mobile';
  lastSync?: string;
  githubToken?: string;
  gistId?: string;
}

export interface AppData {
  version: number;
  phase: number;
  mode: string;
  profile: Profile;
  nutritionPlan: NutritionPlan;
  days: { [date: string]: DayData };
  customExercises: Exercise[];
  enabledWidgets: string[];
  categoryImages: { [key: string]: string };
  syncSettings: SyncSettings;
}

export interface Exercise {
  id: string;
  name: { en: string; zh: string };
  part: string;
  equipment: string;
  image: string;
}
