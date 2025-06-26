
import { PageHeader } from '@/components/layout/PageHeader';
import { BrainCircuit } from 'lucide-react';

export default function BusinessIntelligencePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 md:p-8 pb-0">
        <PageHeader 
          title="Business Intelligence" 
          icon={BrainCircuit}
          description="Visualize dados e insights através de painéis interativos."
        />
      </div>
      <div className="flex-grow p-6 md:p-8 pt-2">
        <iframe
          src="https://lookerstudio.google.com/embed/reporting/7be211eb-41e9-4d89-8e83-8e6cacaf3180/page/p_dxz9m19rtd"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border rounded-lg bg-card"
          title="Painel de Business Intelligence"
        ></iframe>
      </div>
    </div>
  );
}
