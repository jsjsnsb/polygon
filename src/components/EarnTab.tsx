import { useQuery } from "@tanstack/react-query";
import { Calendar, PlayCircle, Users, MessageCircle, Twitter } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface EarnTabProps {
  user: UserType;
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function EarnTab({ user, showLoading, hideLoading, showToast }: EarnTabProps) {
  // Get active tasks
  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      return response.json();
    },
  });

  const earnMethods = [
    {
      icon: Calendar,
      title: "Daily Check-in",
      description: "Once per day",
      reward: "0.05 POLYGON",
      bgColor: "bg-crypto-green/20",
      iconColor: "text-crypto-green",
    },
    {
      icon: PlayCircle,
      title: "Watch Ads",
      description: "Up to 15 per day",
      reward: "0.01 POLYGON",
      bgColor: "bg-crypto-amber/20",
      iconColor: "text-crypto-amber",
    },
    {
      icon: Users,
      title: "Invite Friends",
      description: "9% of their earnings",
      reward: "9% Commission",
      bgColor: "bg-crypto-blue/20",
      iconColor: "text-crypto-blue",
    },
  ];

  const bonusTasks = [
    {
      icon: MessageCircle,
      title: "Join Telegram Channel",
      description: "One-time bonus",
      reward: "0.25 POLYGON",
      bgColor: "bg-crypto-purple/20",
      iconColor: "text-crypto-purple",
      buttonColor: "bg-crypto-purple",
      url: "https://t.me/polyearn_channel",
    },
    {
      icon: Twitter,
      title: "Follow on Twitter",
      description: "One-time bonus",
      reward: "0.15 POLYGON",
      bgColor: "bg-crypto-blue/20",
      iconColor: "text-crypto-blue",
      buttonColor: "bg-crypto-blue",
      url: "https://twitter.com/polyearn",
    },
  ];

  const handleTaskStart = (url: string, title: string) => {
    showToast(`Opening ${title}...`, "info");
    window.open(url, '_blank');
  };

  return (
    <div id="earn-tab" className="mt-6 space-y-6" data-testid="earn-tab">
      {/* Featured Earning Methods */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Earning Methods</h3>
        
        <div className="space-y-4">
          {earnMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-crypto-dark rounded-lg border border-crypto-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${method.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${method.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium">{method.title}</p>
                    <p className="text-sm text-crypto-muted">{method.description}</p>
                  </div>
                </div>
                <span className="text-crypto-green font-semibold">{method.reward}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus Tasks */}
      <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
        <h3 className="text-lg font-semibold mb-4">Bonus Tasks</h3>
        
        <div className="space-y-3">
          {bonusTasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-crypto-dark rounded-lg border border-crypto-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${task.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${task.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-crypto-muted">{task.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-crypto-green font-semibold text-sm">+{task.reward}</span>
                  <button 
                    className={`block text-xs ${task.buttonColor} px-3 py-1 rounded-full mt-1 text-white hover:opacity-80 transition-opacity`}
                    onClick={() => handleTaskStart(task.url, task.title)}
                    data-testid={`button-task-${index}`}
                  >
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="earning-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Weekly Challenge</h3>
            <p className="text-sm text-crypto-muted">Complete to earn bonus</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-crypto-purple" data-testid="text-challenge-progress">
              {user.checkinStreak && user.checkinStreak >= 7 ? "7/7" : `${Math.min(user.checkinStreak || 0, 7)}/7`}
            </p>
            <p className="text-xs text-crypto-muted">Days</p>
          </div>
        </div>
        
        <div className="w-full bg-crypto-border rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-crypto-purple to-crypto-blue h-2 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min((user.checkinStreak || 0) / 7 * 100, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-crypto-muted">Reward: 1.00 POLYGON</span>
          <span className="text-crypto-purple font-medium">
            {user.checkinStreak && user.checkinStreak >= 7 ? "Completed!" : `${7 - (user.checkinStreak || 0)} days left`}
          </span>
        </div>
      </div>

      {/* Additional Tasks from Database */}
      {tasksData?.tasks?.length > 0 && (
        <div className="bg-crypto-card rounded-xl p-6 border border-crypto-border">
          <h3 className="text-lg font-semibold mb-4">Additional Tasks</h3>
          
          <div className="space-y-3">
            {tasksData.tasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-crypto-dark rounded-lg border border-crypto-border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-crypto-purple/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-crypto-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-crypto-muted">{task.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-crypto-green font-semibold text-sm">+{task.reward} POLYGON</span>
                  <button 
                    className="block text-xs bg-crypto-purple px-3 py-1 rounded-full mt-1 text-white hover:opacity-80 transition-opacity"
                    onClick={() => task.url && handleTaskStart(task.url, task.title)}
                    data-testid={`button-db-task-${task.id}`}
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
