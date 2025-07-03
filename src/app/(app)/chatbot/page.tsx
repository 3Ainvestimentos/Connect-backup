
import { PageHeader } from '@/components/layout/PageHeader';
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
        <div className="flex-grow p-6 md:p-8 pt-2">
            <iframe
                src="https://URL-DO-SEU-APP-BOB.web.app"
                className="w-full h-full border rounded-lg bg-card"
                title="Assistente Bob 1.0"
                allow="microphone"
            ></iframe>
        </div>
    </div>
  );
}
