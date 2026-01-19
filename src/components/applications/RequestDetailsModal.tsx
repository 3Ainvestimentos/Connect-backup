

"use client";

import React, { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Calendar, Type, Clock, FileText, History, Download, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useApplications } from '@/contexts/ApplicationsContext';
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkflowRequest | null;
}

export function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  const { workflowDefinitions } = useApplications();

  const definition = useMemo(() => {
    if (!request) return null;
    return workflowDefinitions.find(def => def.name === request.type);
  }, [request, workflowDefinitions]);

  if (!request) return null;

  const renderFieldValue = (fieldId: string, value: any) => {
    const fieldDef = definition?.fields.find(f => f.id === fieldId);
    if (!fieldDef) return <p><strong>{fieldId}:</strong> {JSON.stringify(value)}</p>;
    
    let displayValue: React.ReactNode = value;

    if (fieldDef.type === 'file' && typeof value === 'string' && value) {
      const fileName = value.split('%2F').pop()?.split('?')[0] || 'Arquivo';
      return (
        <div className="flex items-center gap-2">
            <p className="text-muted-foreground"><strong className="font-medium text-foreground">{fieldDef.label}:</strong></p>
            <Button asChild variant="link" className="p-0 h-auto">
                <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    {decodeURIComponent(fileName)}
                    <ExternalLink className="h-3 w-3" />
                </a>
            </Button>
        </div>
      );
    }
    else if (fieldDef.type === 'date' && value) {
      // Handle both Date objects and ISO strings
      const date = typeof value === 'string' ? parseISO(value) : value;
      displayValue = isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida';
    } else if (fieldDef.type === 'date-range' && value) {
      const from = value.from ? parseISO(value.from) : null;
      const to = value.to ? parseISO(value.to) : null;
      displayValue = (from && isValid(from) && to && isValid(to)) 
        ? `${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`
        : 'Período inválido';
    }

    return (
       <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
        <strong>{fieldDef.label}:</strong>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayValue?.toString() || ''}</ReactMarkdown>
      </div>
    )
  }

  const renderFormData = () => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/d51075b1-a735-41d8-b8b9-216099fda8f7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RequestDetailsModal.tsx:77',message:'renderFormData entry - reading formData',data:{requestId:request.requestId,hasFormData:!!request.formData,formDataKeys:request.formData?Object.keys(request.formData):[],formDataSize:request.formData?Object.keys(request.formData).length:0,formDataFull:request.formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!definition || !definition.fields) return <p>Sem definição de formulário encontrada.</p>;
    if (!request.formData || Object.keys(request.formData).length === 0) return <p>Sem dados de formulário.</p>;
    
    const renderedKeys = new Set<string>();

    return (
        <div className="space-y-2">
            {definition.fields.map((field, index) => {
                const value = request.formData[field.id];
                // CORREÇÃO: Detectar objetos vazios e valores inválidos
                if (value === undefined || value === null || 
                    (typeof value === 'string' && value.trim() === '') ||
                    (typeof value === 'object' && Object.keys(value).length === 0)) {
                    return null; // Não exibe campos vazios ou inválidos
                }
                renderedKeys.add(field.id);
                return (
                    <div key={`def-${field.id}-${index}`}>
                        {renderFieldValue(field.id, value)}
                    </div>
                );
            })}
            {Object.entries(request.formData).map(([key, value], index) => {
              // CORREÇÃO: Verificar se já foi renderizado E filtrar objetos vazios
              if (renderedKeys.has(key)) {
                return null; // Já foi renderizado no loop anterior
              }
              // CORREÇÃO: Filtrar valores inválidos e objetos vazios
              if (value === undefined || value === null || 
                  (typeof value === 'string' && value.trim() === '') ||
                  (typeof value === 'object' && Object.keys(value).length === 0)) {
                return null;
              }
              // CORREÇÃO: Usar chave única combinando key e index para evitar duplicatas
              return (
                  <div key={`extra-${key}-${index}`}>
                    {renderFieldValue(key, value)}
                  </div>
              )
            })}
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" /> Detalhes da Solicitação
          </DialogTitle>
          <DialogDescription>
            Revise as informações e o histórico da sua solicitação.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Solicitante:</span> {request.submittedBy.userName}</div>
                </div>
                 <div className="flex items-start gap-3">
                    <Type className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Tipo:</span> {request.type}</div>
                </div>
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Data:</span> {format(parseISO(request.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
                 <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Última Atualização:</span> {format(parseISO(request.lastUpdatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="font-semibold text-lg mb-2">Dados Enviados</h3>
                <div className="p-4 bg-muted/50 rounded-md text-sm break-words whitespace-pre-wrap">
                    {renderFormData()}
                </div>
            </div>

             <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <History className="h-5 w-5"/>
                    Histórico
                </h3>
                <div className="space-y-3">
                    {request.history.slice().reverse().map((log, index) => (
                        <div key={index} className="flex items-start gap-3 text-xs">
                             <div className="flex flex-col items-center">
                                <Badge variant="secondary" className="font-semibold">{definition?.statuses.find(s => s.id === log.status)?.label || log.status}</Badge>
                                {index !== request.history.length - 1 && <div className="w-px h-6 bg-border" />}
                            </div>
                            <div className="pt-0.5 prose prose-sm dark:prose-invert max-w-none">
                                <p className="font-semibold">{log.userName} <span className="text-muted-foreground font-normal">({format(parseISO(log.timestamp), 'dd/MM/yy HH:mm')})</span></p>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-muted-foreground">{log.notes}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="outline" className="hover:bg-muted">Fechar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
