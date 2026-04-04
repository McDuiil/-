import { useState } from "react";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Workouts from "./components/Workouts";
import Nutrition from "./components/Nutrition";
import Profile from "./components/Profile";
import { AnimatePresence, motion } from "motion/react";

type Tab = "dashboard" | "workouts" | "nutrition" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

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
    </div>
  );
}
