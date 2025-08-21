interface LoadingModalProps {
  isOpen: boolean;
  text: string;
}

export default function LoadingModal({ isOpen, text }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" data-testid="loading-modal">
      <div className="bg-crypto-card rounded-xl p-8 border border-crypto-border max-w-sm mx-4 text-center">
        <div className="w-16 h-16 border-4 border-crypto-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-crypto-text" data-testid="loading-text">{text}</p>
      </div>
    </div>
  );
}
