import { useState, useEffect } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  BackButton: any;
  MainButton: any;
  expand(): void;
  close(): void;
  sendData(data: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        
        // Expand the web app
        tg.expand();
        
        // Hide main button initially
        tg.MainButton.hide();
        
        // Get user data
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
        }
        
        setIsReady(true);
      } else {
        // For development/testing purposes
        const mockUser: TelegramUser = {
          id: 123456789,
          first_name: "Test",
          last_name: "User", 
          username: "testuser",
          language_code: "en",
        };
        setUser(mockUser);
        setIsReady(true);
      }
    };

    // Initialize immediately if Telegram is available
    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      // Wait for Telegram script to load
      const script = document.querySelector('script[src*="telegram-web-app"]');
      if (script) {
        script.addEventListener('load', initTelegram);
      } else {
        // Fallback for development
        setTimeout(initTelegram, 100);
      }
    }

    return () => {
      const script = document.querySelector('script[src*="telegram-web-app"]');
      if (script) {
        script.removeEventListener('load', initTelegram);
      }
    };
  }, []);

  const sendData = (data: any) => {
    if (webApp) {
      webApp.sendData(JSON.stringify(data));
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  return {
    isReady,
    user,
    webApp,
    sendData,
    close,
  };
}
