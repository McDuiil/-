import { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Workouts from "./components/Workouts";
import Nutrition from "./components/Nutrition";
import Profile from "./components/Profile";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "./context/AppContext";
import GlassCard from "./components/GlassCard";
import { X } from "lucide-react";

type Tab = "dashboard" | "workouts" | "nutrition" | "profile";

export default function App() {
  const { appData, setAppData, t, selectedDate, setSelectedDate, activeTab, setActiveTab } = useApp();
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [tempWeight, setTempWeight] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasWeightToday = appData.days[today]?.weight;
    
    // Only prompt if today's weight is missing and we haven't prompted in this session
    if (!hasWeightToday && !sessionStorage.getItem('weightPromptShown')) {
      setShowWeightPrompt(true);
      sessionStorage.setItem('weightPromptShown', 'true');
    }
  }, [appData.days]);

  const handleSaveWeight = () => {
    const today = new Date().toISOString().split('T')[0];
    const weightNum = parseFloat(tempWeight);
    if (isNaN(weightNum)) return;

    const updatedDays = { ...appData.days };
    if (!updatedDays[today]) {
      updatedDays[today] = {
        date: today,
        calories: 0,
        steps: 0,
        water: 0,
        weight: weightNum,
        meals: [],
        workoutSessions: []
      };
    } else {
      updatedDays[today] = { ...updatedDays[today], weight: weightNum };
    }

    setAppData({
      ...appData,
      profile: { ...appData.profile, weight: weightNum },
      days: updatedDays
    });
    setShowWeightPrompt(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "workouts":
        return <Workouts />;
      case "nutrition":
        return <Nutrition />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-md mx-auto relative overflow-x-hidden no-scrollbar">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[100px]" />
      </div>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Weight Prompt Modal */}
      {showWeightPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm space-y-4 border-white/20 bg-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("weightPrompt")}</h2>
              <button onClick={() => setShowWeightPrompt(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-white/60">{t("enterWeight")}</p>
              <input 
                type="number" 
                step="0.1"
                autoFocus
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={appData.profile.weight.toString()}
                value={tempWeight}
                onChange={e => setTempWeight(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveWeight()}
              />
              <button 
                onClick={handleSaveWeight}
                className="w-full rounded-2xl bg-blue-500 py-4 text-sm font-bold text-white transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
              >
                {t("save")}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
