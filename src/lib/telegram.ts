export function shareToTelegram(text: string, url?: string) {
  const message = url ? `${text}\n${url}` : text;
  const encodedMessage = encodeURIComponent(message);
  
  if (window.Telegram?.WebApp) {
    // Use Telegram WebApp API if available
    window.Telegram.WebApp.sendData(JSON.stringify({
      action: "share",
      text: message,
    }));
  } else {
    // Fallback to direct Telegram URL
    window.open(`https://t.me/share/url?url=${encodedMessage}`, '_blank');
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => resolve(false));
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        resolve(true);
      } catch (err) {
        textArea.remove();
        resolve(false);
      }
    }
  });
}

export function formatBalance(balance: string | number): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  return num.toFixed(4);
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  // Mock conversion rate - in production, this should come from an API
  const usdRate = 0.6; // 1 POLYGON ≈ $0.60
  return (num * usdRate).toFixed(2);
}

export function getTimeUntilNextCheckin(lastCheckin: string | null): string {
  if (!lastCheckin) return "Available now";
  
  const last = new Date(lastCheckin);
  const nextCheckin = new Date(last);
  nextCheckin.setDate(nextCheckin.getDate() + 1);
  nextCheckin.setHours(0, 0, 0, 0); // Reset to start of day
  
  const now = new Date();
  
  if (now >= nextCheckin) {
    return "Available now";
  }
  
  const diff = nextCheckin.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
