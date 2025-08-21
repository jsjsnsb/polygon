import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Info } from "lucide-react";
import { formatBalance } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User as UserType } from "@shared/schema";

interface WithdrawTabProps {
  user: UserType;
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function WithdrawTab({ user, showLoading, hideLoading, showToast }: WithdrawTabProps) {
  const [amount, setAmount] = useState("");
  const [binanceId, setBinanceId] = useState(user.binanceId || "");

  // Get withdrawal history
  const { data: withdrawalsData } = useQuery({
    queryKey: ["withdrawals", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/withdrawals/${user.id}`);
      return response.json();
    },
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; binanceId: string }) => {
      const response = await apiRequest("POST", "/api/withdraw", {
        userId: user.id,
        amount: data.amount,
        binanceId: data.binanceId,
      });
      return response.json();
    },
    onMutate: () => {
      showLoading("Submitting withdrawal request...");
    },
    onSuccess: (data) => {
      hideLoading();
      if (data.success) {
        showToast("Withdrawal request submitted successfully!", "success");
        setAmount("");
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
        queryClient.invalidateQueries({ queryKey: ["withdrawals", user.id] });
      } else {
        showToast(data.error || "Withdrawal request failed", "error");
      }
    },
    onError: (error: any) => {
      hideLoading();
      showToast(error.message || "Withdrawal request failed", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    const userBalance = parseFloat(user.balance);
    
    if (!amount || withdrawAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    
    if (withdrawAmount < 0.5) {
      showToast("Minimum withdrawal amount is 0.5 POLYGON", "error");
      return;
    }
    
    if (withdrawAmount > userBalance) {
      showToast("Insufficient balance", "error");
      return;
    }
    
    if (!binanceId.trim()) {
      showToast("Please enter your Binance ID", "error");
      return;
    }
    
    withdrawMutation.mutate({ amount, binanceId: binanceId.trim() });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-crypto-green/20 text-crypto-green";
      case "processing":
        return "bg-crypto-amber/20 text-crypto-amber";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-crypto-blue/20 text-crypto-blue";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <div id="withdraw-tab" className="mt-6 space-y-6" data-testid="withdraw-tab">
      {/* Withdrawal Form */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Withdraw POLYGON</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm text-crypto-muted mb-2">Available Balance</Label>
            <div className="bg-crypto-dark rounded-lg p-4 border border-crypto-border">
              <span className="text-2xl font-bold text-crypto-green" data-testid="text-available-balance">
                {formatBalance(user.balance)}
              </span>
              <span className="text-lg text-crypto-blue ml-2">POLYGON</span>
            </div>
          </div>
          
          <div>
            <Label className="block text-sm text-crypto-muted mb-2">Withdrawal Amount</Label>
            <div className="relative">
              <Input
                type="number"
                className="w-full bg-crypto-dark border border-crypto-border rounded-lg px-4 py-3 text-crypto-text focus:border-crypto-blue pr-20"
                placeholder="0.0000"
                step="0.0001"
                min="0.5"
                max={user.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-amount"
              />
              <span className="absolute right-4 top-3 text-crypto-blue">POLYGON</span>
            </div>
            <p className="text-xs text-crypto-muted mt-1">Minimum withdrawal: 0.5 POLYGON</p>
          </div>
          
          <div>
            <Label className="block text-sm text-crypto-muted mb-2">Binance ID</Label>
            <Input
              type="text"
              className="w-full bg-crypto-dark border border-crypto-border rounded-lg px-4 py-3 text-crypto-text focus:border-crypto-blue"
              placeholder="Enter your Binance ID"
              value={binanceId}
              onChange={(e) => setBinanceId(e.target.value)}
              data-testid="input-binance-id"
            />
          </div>
          
          <div className="bg-crypto-dark rounded-lg p-4 border border-crypto-border">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-crypto-blue mt-0.5" />
              <div className="text-sm text-crypto-muted">
                <p className="mb-2">Withdrawal Information:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Processing time: 1-3 business days</li>
                  <li>• Network: Polygon (MATIC)</li>
                  <li>• No withdrawal fees</li>
                  <li>• Make sure your Binance ID is correct</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-crypto-green to-crypto-blue text-white font-semibold py-3 rounded-xl hover:opacity-80 transition-opacity"
            disabled={withdrawMutation.isPending}
            data-testid="button-withdraw"
          >
            Request Withdrawal
          </Button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
        
        {withdrawalsData?.withdrawals?.length > 0 ? (
          <div className="space-y-3">
            {withdrawalsData.withdrawals.map((withdrawal: any) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-crypto-dark rounded-lg border border-crypto-border">
                <div>
                  <p className="text-sm font-medium">
                    {formatBalance(withdrawal.amount)} POLYGON
                  </p>
                  <p className="text-xs text-crypto-muted">
                    {new Date(withdrawal.createdAt).toLocaleDateString()} • {new Date(withdrawal.createdAt).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-crypto-muted">
                    Binance ID: {withdrawal.binanceId}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(withdrawal.status)}`}>
                  {getStatusText(withdrawal.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-crypto-muted text-center py-4">
            No withdrawal history yet
          </p>
        )}
      </div>
    </div>
  );
}
