import { useRouter } from 'next/navigation';
import React from 'react';
import Image from 'next/image';

interface ChatbotButtonProps {
  className?: string;
}

export default function ChatbotButton({ className = "" }: ChatbotButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/cera'); // Redirect to CERA chatbot page
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 rounded-full shadow-xl hover:scale-110 transition-all duration-300 z-50 border-2 border-white/20 ${className}`}
      title="Chat with CERA AI Assistant"
      aria-label="Open CERA AI Assistant"
    >
      <Image
        src="/chatbot-icon.png"
        alt="CERA AI Assistant"
        width={32}
        height={32}
        className="rounded-full"
        priority
      />
    </button>
  );
}
