import { PageHeader } from '@/components/layout/PageHeader';
import ChatInterface from '@/components/chatbot/ChatInterface';
import { Bot } from 'lucide-react';

export default function ChatbotPage() {
  return (
    <div className="flex flex-col h-full">
        <div className="p-6 md:p-8 pb-0">
            <PageHeader 
                title="Bob" 
                icon={Bot}
                description="Converse com Bob para obter ajuda e informações."
            />
        </div>
        <div className="flex flex-grow p-6 md:p-8 pt-2">
            <ChatInterface />
        </div>
    </div>
  );
}
