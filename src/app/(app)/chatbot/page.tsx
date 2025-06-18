
import { PageHeader } from '@/components/layout/PageHeader';
import ChatInterface from '@/components/chatbot/ChatInterface';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';

export default function ChatbotPage() {
  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)] flex flex-col"> {/* Adjust var if header height differs */}
      <PageHeader 
        title="Chatbot Bob" 
        icon={Bot}
        description="Converse com Bob para obter ajuda e informações."
      />
      <ChatInterface />
    </div>
  );
}
