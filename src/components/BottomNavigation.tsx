import { Home, DollarSign, Users, CreditCard } from "lucide-react";

type Tab = "dashboard" | "earn" | "referral" | "withdraw";

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: Home },
    { id: "earn" as Tab, label: "Earn", icon: DollarSign },
    { id: "referral" as Tab, label: "Referral", icon: Users },
    { id: "withdraw" as Tab, label: "Withdraw", icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-crypto-dark/90 backdrop-blur-md border-t border-crypto-border" data-testid="bottom-navigation">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={`flex flex-col items-center py-2 px-4 transition-colors ${
                  isActive ? "text-crypto-blue" : "text-crypto-muted hover:text-crypto-text"
                }`}
                onClick={() => onTabChange(tab.id)}
                data-testid={`nav-tab-${tab.id}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{tab.label}</span>
                <div 
                  className={`tab-indicator w-full h-0.5 mt-1 rounded-full transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
