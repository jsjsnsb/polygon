import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, TrendingUp, Users, PlayCircle } from "lucide-react";
import { formatBalance, getTimeUntilNextCheckin } from "@/lib/telegram";
import { useState, useEffect } from "react";
import type { User as UserType } from "@shared/schema";

interface DashboardTabProps {
  user: UserType;
  stats: any;
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function DashboardTab({ user, stats, showLoading, hideLoading, showToast }: DashboardTabProps) {
  const [nextCheckinTime, setNextCheckinTime] = useState("");

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      setNextCheckinTime(getTimeUntilNextCheckin(user.lastCheckin));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [user.lastCheckin]);

  // Get recent transactions
  const { data: transactionsData } = useQuery({
    queryKey: ["transactions", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${user.id}`);
      return response.json();
    },
  });

  // Daily check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/checkin/${user.id}`, {});
      return response.json();
    },
    onMutate: () => {
      showLoading("Processing daily check-in...");
    },
    onSuccess: (data) => {
      hideLoading();
      if (data.success) {
        showToast(`Daily check-in successful! +${data.reward} POLYGON`, "success");
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
        queryClient.invalidateQueries({ queryKey: ["transactions", user.id] });
      } else {
        showToast(data.error || "Check-in failed", "error");
      }
    },
    onError: (error: any) => {
      hideLoading();
      showToast(error.message || "Check-in failed", "error");
    },
  });

  // Watch ad mutation
  const watchAdMutation = useMutation({
    mutationFn: async () => {
      // First show Gigapub ad
      if (window.showGiga) {
        await window.showGiga();
      }
      
      // Then process the reward
      const response = await apiRequest("POST", `/api/ad/watch/${user.id}`, {});
      return response.json();
    },
    onMutate: () => {
      showLoading("Loading advertisement...");
    },
    onSuccess: (data) => {
      hideLoading();
      if (data.success) {
        showToast(`Ad watched successfully! +${data.reward} POLYGON`, "success");
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
        queryClient.invalidateQueries({ queryKey: ["transactions", user.id] });
      } else {
        showToast(data.error || "Ad watching failed", "error");
      }
    },
    onError: (error: any) => {
      hideLoading();
      showToast(error.message || "Ad watching failed", "error");
    },
  });

  const canCheckinToday = () => {
    if (!user.lastCheckin) return true;
    const lastCheckin = new Date(user.lastCheckin);
    const today = new Date();
    return lastCheckin.toDateString() !== today.toDateString();
  };

  const getCheckinProgress = () => {
    if (canCheckinToday()) return 0;
    return 100; // Already checked in
  };

  const adsWatched = user.todayAdsWatched || 0;
  const maxAds = 15;
  const adsRemaining = maxAds - adsWatched;
  const adProgress = (adsWatched / maxAds) * 100;

  return (
    <div id="dashboard-tab" className="mt-6 space-y-6" data-testid="dashboard-tab">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-crypto-card rounded-xl p-4 border border-crypto-border">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-crypto-green" />
            <span className="text-sm text-crypto-muted">Today's Earn</span>
          </div>
          <p className="text-xl font-bold text-crypto-green" data-testid="text-today-earning">
            {formatBalance(stats?.todayEarning || "0")}
          </p>
          <p className="text-xs text-crypto-muted">Keep earning!</p>
        </div>
        
        <div className="bg-crypto-card rounded-xl p-4 border border-crypto-border">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-crypto-blue" />
            <span className="text-sm text-crypto-muted">Referrals</span>
          </div>
          <p className="text-xl font-bold text-crypto-blue" data-testid="text-referral-count">
            {stats?.referralCount || 0}
          </p>
          <p className="text-xs text-crypto-muted">9% commission</p>
        </div>
      </div>

      {/* Daily Check-in Card */}
      <div className="earning-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Daily Check-in</h3>
            <p className="text-sm text-crypto-muted">Earn 0.05 POLYGON daily</p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 progress-ring" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="4" fill="none"/>
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                stroke="#00D4FF" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="176" 
                strokeDashoffset={176 - (176 * getCheckinProgress() / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-crypto-blue" />
            </div>
          </div>
        </div>
        
        <button 
          className="w-full bg-gradient-to-r from-crypto-blue to-crypto-purple text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => checkinMutation.mutate()}
          disabled={!canCheckinToday() || checkinMutation.isPending}
          data-testid="button-checkin"
        >
          <span>
            {canCheckinToday() ? "Claim Daily Reward" : "Already Checked In"}
          </span>
        </button>
        
        <div className="flex items-center justify-between mt-3 text-sm text-crypto-muted">
          <span>
            Streak: <span className="text-crypto-green font-medium" data-testid="text-streak">
              {user.checkinStreak || 0} days
            </span>
          </span>
          <span>
            Next: <span data-testid="text-next-checkin">{nextCheckinTime}</span>
          </span>
        </div>
      </div>

      {/* Ads Section */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Watch Ads</h3>
            <p className="text-sm text-crypto-muted">Earn 0.01 POLYGON per ad</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-crypto-amber" data-testid="text-ads-watched">
              {adsWatched}
            </p>
            <p className="text-xs text-crypto-muted">/ {maxAds} today</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-crypto-border rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-crypto-amber to-crypto-green h-2 rounded-full transition-all duration-300" 
            style={{ width: `${adProgress}%` }}
          />
        </div>
        
        <button 
          className="w-full bg-crypto-amber text-black font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => watchAdMutation.mutate()}
          disabled={adsRemaining <= 0 || watchAdMutation.isPending}
          data-testid="button-watch-ad"
        >
          <div className="flex items-center justify-center space-x-2">
            <PlayCircle className="w-5 h-5" />
            <span>Watch Ad (+0.01 POLYGON)</span>
          </div>
        </button>
        
        <p className="text-xs text-center text-crypto-muted mt-2" data-testid="text-ads-remaining">
          {adsRemaining} ads remaining today
        </p>
      </div>

      {/* Recent Earnings */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Recent Earnings</h3>
        
        {transactionsData?.transactions?.length > 0 ? (
          <div className="space-y-3">
            {transactionsData.transactions.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'checkin' ? 'bg-crypto-green/20' :
                    transaction.type === 'ad' ? 'bg-crypto-amber/20' :
                    transaction.type === 'referral' ? 'bg-crypto-blue/20' :
                    'bg-crypto-purple/20'
                  }`}>
                    {transaction.type === 'checkin' && <Calendar className="w-4 h-4 text-crypto-green" />}
                    {transaction.type === 'ad' && <PlayCircle className="w-4 h-4 text-crypto-amber" />}
                    {transaction.type === 'referral' && <Users className="w-4 h-4 text-crypto-blue" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-crypto-muted">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-crypto-green font-semibold">
                  +{formatBalance(transaction.amount)} POLYGON
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-crypto-muted text-center py-4">No earnings yet. Start by checking in daily!</p>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    showGiga?: () => Promise<void>;
  }
}
