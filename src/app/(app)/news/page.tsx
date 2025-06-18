
import { PageHeader } from '@/components/layout/PageHeader';
import NewsFeedClient from '@/components/news/NewsFeedClient';
import { Newspaper, Search, Filter } from 'lucide-react';

// Mock data for news items
const mockNewsItems = [
  { id: '1', title: "Lançamento da Nova Intranet Corporativa", snippet: "Descubra as funcionalidades e benefícios da nova intranet...", category: "Tecnologia", date: "2024-07-15", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate communication" },
  { id: '2', title: "Resultados Financeiros do Segundo Trimestre", snippet: "Análise detalhada do desempenho financeiro da empresa no Q2.", category: "Financeiro", date: "2024-07-10", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "financial report" },
  { id: '3', title: "Programa de Bem-Estar: Novas Iniciativas", snippet: "Conheça as novas atividades e programas para promover o bem-estar...", category: "RH", date: "2024-07-05", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "employee wellness" },
  { id: '4', title: "Atualização da Política de Segurança de Dados", snippet: "Informações importantes sobre as novas diretrizes de segurança...", category: "Segurança", date: "2024-07-01", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "data privacy" },
  { id: '5', title: "Parceria Estratégica com Empresa X Anunciada", snippet: "Saiba mais sobre a nova parceria e suas implicações para o futuro.", category: "Estratégia", date: "2024-06-28", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "business partnership" },
  { id: '6', title: "Voluntariado Corporativo: Resultados da Campanha", snippet: "Veja o impacto positivo das nossas ações de voluntariado na comunidade.", category: "ESG", date: "2024-06-20", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate volunteering" },
];

const categories = Array.from(new Set(mockNewsItems.map(item => item.category)));

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  category: string;
  date: string;
  imageUrl: string;
  dataAiHint?: string;
}

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Feed de Notícias" 
        icon={Newspaper}
        description="Mantenha-se atualizado com as últimas notícias e comunicados."
      />
      <NewsFeedClient initialNewsItems={mockNewsItems} categories={categories} />
    </div>
  );
}
