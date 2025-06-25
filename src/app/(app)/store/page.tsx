
import { PageHeader } from '@/components/layout/PageHeader';
import { ShoppingCart } from 'lucide-react';

export default function StorePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 md:p-8 pb-0">
        <PageHeader 
          title="Store" 
          icon={ShoppingCart}
          description="Navegue e compre na nossa loja corporativa."
        />
      </div>
      <div className="flex-grow p-6 md:p-8 pt-2">
        <iframe
          src="https://www.store-3ariva.com.br/"
          title="Store 3A RIVA"
          className="w-full h-full border rounded-lg bg-card"
        />
      </div>
    </div>
  );
}
