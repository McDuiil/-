import { LayoutDashboard, Dumbbell, Utensils, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { useApp } from "@/src/context/AppContext";

type Tab = "dashboard" | "workouts" | "nutrition" | "profile";

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { t } = useApp();
  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { id: "workouts", icon: Dumbbell, label: t("workouts") },
    { id: "nutrition", icon: Utensils, label: t("nutrition") },
    { id: "profile", icon: User, label: t("profile") },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
      <div className="glass-darker flex items-center justify-around rounded-full p-2 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-full px-4 py-2 transition-all duration-300",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} className={cn("z-10 transition-transform duration-300", isActive && "scale-110")} />
              <span className="z-10 text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
