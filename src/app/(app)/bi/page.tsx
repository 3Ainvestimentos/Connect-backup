
import { PageHeader } from '@/components/layout/PageHeader';
import { AreaChart } from 'lucide-react';

export default function BusinessIntelligencePage() {
  return (
    <div className="flex flex-col h-full p-6 md:p-8">
      <div className="mb-4">
        <PageHeader 
          title="Business Intelligence" 
          icon={AreaChart}
          description="Visualize dados e insights através de painéis interativos."
        />
      </div>
      <div className="flex-grow -mt-6">
        <iframe
          src="https://lookerstudio.google.com/embed/reporting/7be211eb-41e9-4d89-8e83-8e6cacaf3180/page/p_dxz9m19rtd"
          frameBorder="0"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border rounded-lg bg-card"
          title="Painel de Business Intelligence"
        ></iframe>
      </div>
    </div>
  );
}
