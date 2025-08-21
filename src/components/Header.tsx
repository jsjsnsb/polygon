import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User } from "lucide-react";
import { formatBalance, formatCurrency } from "@/lib/telegram";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  user: UserType;
  stats: any;
}

export default function Header({ user, stats }: HeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-50 bg-crypto-dark/90 backdrop-blur-md border-b border-crypto-border" data-testid="header">
      <div className="max-w-md mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.photoUrl || ""} alt={user.firstName} />
              <AvatarFallback className="bg-gradient-to-r from-crypto-blue to-crypto-purple">
                <User className="w-5 h-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-crypto-muted" data-testid="text-greeting">{getGreeting()}</p>
              <h2 className="text-base font-semibold" data-testid="text-username">
                {user.firstName} {user.lastName}
              </h2>
            </div>
          </div>
          <button 
            className="p-2 rounded-lg bg-crypto-card border border-crypto-border hover:bg-crypto-border transition-colors" 
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
        
        {/* Balance Display */}
        <div className="mt-4 gradient-border">
          <div className="gradient-border-content text-center">
            <p className="text-sm text-crypto-muted mb-1">Total Balance</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl font-bold text-crypto-green" data-testid="text-balance">
                {formatBalance(user.balance)}
              </span>
              <span className="text-lg font-medium text-crypto-blue">POLYGON</span>
            </div>
            <p className="text-xs text-crypto-muted mt-1" data-testid="text-balance-usd">
              ≈ ${formatCurrency(user.balance)} USD
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
