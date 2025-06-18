
import { PageHeader } from '@/components/layout/PageHeader';
import DocumentRepositoryClient from '@/components/documents/DocumentRepositoryClient';
import { FolderOpen, Search, Filter } from 'lucide-react';

// Mock data for documents
const mockDocuments = [
  { id: 'doc1', name: "Relatório Anual 2023.pdf", category: "Relatórios", type: "pdf", size: "2.5MB", lastModified: "2024-07-01", dataAiHint: "annual report" },
  { id: 'doc2', name: "Manual do Colaborador.docx", category: "Manuais", type: "docx", size: "1.2MB", lastModified: "2024-06-15", dataAiHint: "employee handbook" },
  { id: 'doc3', name: "Apresentação Institucional.pptx", category: "Apresentações", type: "pptx", size: "5.8MB", lastModified: "2024-05-20", dataAiHint: "company presentation" },
  { id: 'doc4', name: "Política de Férias.pdf", category: "Políticas", type: "pdf", size: "300KB", lastModified: "2024-07-10", dataAiHint: "vacation policy" },
  { id: 'doc5', name: "Planilha de Orçamento Q3.xlsx", category: "Financeiro", type: "xlsx", size: "800KB", lastModified: "2024-07-05", dataAiHint: "budget spreadsheet" },
  { id: 'doc6', name: "Guia de Estilo da Marca.pdf", category: "Marketing", type: "pdf", size: "3.1MB", lastModified: "2024-06-01", dataAiHint: "brand guidelines" },
];

const categories = Array.from(new Set(mockDocuments.map(doc => doc.category)));
const types = Array.from(new Set(mockDocuments.map(doc => doc.type)));


export interface DocumentType {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  lastModified: string;
  dataAiHint?: string;
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Repositório de Documentos" 
        icon={FolderOpen}
        description="Encontre e gerencie documentos importantes da empresa."
      />
      <DocumentRepositoryClient initialDocuments={mockDocuments} categories={categories} types={types} />
    </div>
  );
}
