import { useState, useEffect } from "react";
import { useTelegram } from "@/hooks/use-telegram";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import DashboardTab from "@/components/DashboardTab";
import EarnTab from "@/components/EarnTab";
import ReferralTab from "@/components/ReferralTab";
import WithdrawTab from "@/components/WithdrawTab";
import LoadingModal from "@/components/LoadingModal";

type Tab = "dashboard" | "earn" | "referral" | "withdraw";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");
  const { toast } = useToast();
  const { user: telegramUser, isReady } = useTelegram();

  // Authenticate with backend
  const authMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/telegram", userData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["user", data.user.id], data);
      }
    },
  });

  // Get user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", authMutation.data?.user?.id],
    enabled: !!authMutation.data?.user?.id,
  });

  // Auto-authenticate when Telegram is ready
  useEffect(() => {
    if (isReady && telegramUser && !authMutation.data) {
      const userData = {
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || "",
        username: telegramUser.username || "",
        languageCode: telegramUser.language_code || "",
        photoUrl: telegramUser.photo_url || "",
      };
      
      authMutation.mutate(userData);
    }
  }, [isReady, telegramUser, authMutation]);

  const user = userData?.user;
  const stats = userData?.stats;

  const showLoading = (text: string) => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    toast({
      title: type === "success" ? "Success" : type === "error" ? "Error" : "Info",
      description: message,
      variant: type === "error" ? "destructive" : "default",
    });
  };

  if (!isReady || authMutation.isPending || userLoading) {
    return (
      <div className="min-h-screen bg-crypto-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-crypto-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-crypto-text">Loading PolyEarn...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-crypto-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-crypto-text">Failed to load user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crypto-dark text-crypto-text" data-testid="dashboard-container">
      <Header user={user} stats={stats} />
      
      <main className="max-w-md mx-auto px-5 pb-24">
        {activeTab === "dashboard" && (
          <DashboardTab 
            user={user} 
            stats={stats} 
            showLoading={showLoading}
            hideLoading={hideLoading}
            showToast={showToast}
          />
        )}
        {activeTab === "earn" && (
          <EarnTab 
            user={user} 
            showLoading={showLoading}
            hideLoading={hideLoading}
            showToast={showToast}
          />
        )}
        {activeTab === "referral" && (
          <ReferralTab 
            user={user} 
            stats={stats}
            showToast={showToast}
          />
        )}
        {activeTab === "withdraw" && (
          <WithdrawTab 
            user={user} 
            showLoading={showLoading}
            hideLoading={hideLoading}
            showToast={showToast}
          />
        )}
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <LoadingModal isOpen={isLoading} text={loadingText} />
    </div>
  );
}
