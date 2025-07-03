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
            <div className="w-full h-full border border-muted rounded-lg overflow-hidden">
                <iframe
                    src="https://studio--bob-10-d25zl.us-central1.hosted.app"
                    className="w-full h-full border-none"
                    title="Assistente Bob 1.0"
                    allow="microphone"
                ></iframe>
            </div>
        </div>
    </div>
  );
}
