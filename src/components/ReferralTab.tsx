import { useQuery } from "@tanstack/react-query";
import { Copy, Send, Link, User } from "lucide-react";
import { copyToClipboard, shareToTelegram, formatBalance } from "@/lib/telegram";
import type { User as UserType } from "@shared/schema";

interface ReferralTabProps {
  user: UserType;
  stats: any;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function ReferralTab({ user, stats, showToast }: ReferralTabProps) {
  // Get referral data
  const { data: referralsData } = useQuery({
    queryKey: ["referrals", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/referrals/${user.id}`);
      return response.json();
    },
  });

  // Get referral transactions
  const { data: referralTransactions } = useQuery({
    queryKey: ["transactions", user.id, "referral"],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${user.id}?limit=20`);
      const data = await response.json();
      return {
        ...data,
        transactions: data.transactions?.filter((t: any) => t.type === 'referral') || []
      };
    },
  });

  const referralLink = `https://t.me/your_bot?start=${user.referralCode}`;
  const shareText = `🌟 Join me on PolyEarn and start earning POLYGON tokens daily!\n\n💰 Daily check-ins\n🎥 Watch ads\n👥 Refer friends\n\nUse my referral code: ${user.referralCode}`;

  const handleCopyCode = async () => {
    const success = await copyToClipboard(user.referralCode || "");
    if (success) {
      showToast("Referral code copied to clipboard!", "success");
    } else {
      showToast("Failed to copy referral code", "error");
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      showToast("Referral link copied to clipboard!", "success");
    } else {
      showToast("Failed to copy referral link", "error");
    }
  };

  const handleShareTelegram = () => {
    shareToTelegram(shareText, referralLink);
    showToast("Shared to Telegram!", "success");
  };

  return (
    <div id="referral-tab" className="mt-6 space-y-6" data-testid="referral-tab">
      {/* Referral Stats */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Your Referral Stats</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-crypto-blue" data-testid="text-total-referrals">
              {stats?.referralCount || 0}
            </p>
            <p className="text-sm text-crypto-muted">Total Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-crypto-green" data-testid="text-total-earned">
              {formatBalance(stats?.totalReferralEarnings || "0")}
            </p>
            <p className="text-sm text-crypto-muted">Total Earned</p>
          </div>
        </div>
        
        <div className="bg-crypto-dark rounded-lg p-4 border border-crypto-border">
          <p className="text-sm text-crypto-muted mb-2">Your Referral Code</p>
          <div className="flex items-center justify-between">
            <code className="text-crypto-blue font-mono text-lg" data-testid="text-referral-code">
              {user.referralCode}
            </code>
            <button 
              className="text-crypto-blue hover:text-white transition-colors"
              onClick={handleCopyCode}
              data-testid="button-copy-code"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Share Options */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Invite Friends</h3>
        <p className="text-sm text-crypto-muted mb-4">Share your referral link and earn 9% of their earnings</p>
        
        <div className="space-y-3">
          <button 
            className="w-full bg-crypto-blue text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 hover:opacity-80 transition-opacity"
            onClick={handleShareTelegram}
            data-testid="button-share-telegram"
          >
            <Send className="w-5 h-5" />
            <span>Share on Telegram</span>
          </button>
          
          <button 
            className="w-full bg-crypto-border text-crypto-text font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-crypto-muted/20 transition-colors"
            onClick={handleCopyLink}
            data-testid="button-copy-link"
          >
            <Link className="w-5 h-5" />
            <span>Copy Referral Link</span>
          </button>
        </div>
      </div>

      {/* Referral Earnings */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Recent Referral Earnings</h3>
        
        {referralTransactions?.transactions?.length > 0 ? (
          <div className="space-y-3">
            {referralTransactions.transactions.slice(0, 10).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-crypto-blue/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-crypto-blue" />
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
          <p className="text-crypto-muted text-center py-4">
            No referral earnings yet. Share your link to start earning!
          </p>
        )}
      </div>

      {/* Referral Levels */}
      <div className="earning-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Referral Rewards</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Level 1 (Direct)</span>
            <span className="text-crypto-green font-semibold">9% Commission</span>
          </div>
          <div className="flex items-center justify-between opacity-50">
            <span className="text-sm">Level 2 (Indirect)</span>
            <span className="text-crypto-muted">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
