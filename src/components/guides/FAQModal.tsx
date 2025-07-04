"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface FAQModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqItems = [
  {
    question: "Como posso redefinir minha senha?",
    answer: "Para redefinir sua senha, vá para a página de login e clique em 'Esqueceu a senha?'. Siga as instruções enviadas para o seu e-mail de cadastro. Se você acessa via Google, sua senha é a mesma da sua conta Google."
  },
  {
    question: "Onde encontro meus documentos de RH?",
    answer: "Você pode encontrar todos os seus documentos relacionados ao RH, como holerites e contratos, na seção 'Documentos' do portal, utilizando os filtros para encontrar a categoria 'RH'."
  },
  {
    question: "Como solicito férias?",
    answer: "A solicitação de férias pode ser feita através do menu 'Aplicações' > 'Férias'. Preencha o formulário com as datas desejadas e aguarde a aprovação do seu gestor."
  },
  {
    question: "O chatbot Bob pode me ajudar com tarefas específicas?",
    answer: "Sim, o Bob pode ajudar a encontrar informações, resumir documentos e conversas, e responder a perguntas gerais sobre a empresa. Tente perguntar 'Onde encontro a política de home office?' para ver um exemplo."
  },
  {
    question: "Como acesso a loja de produtos da empresa?",
    answer: "Acesse a loja corporativa através do link 'Store' no menu lateral. Você será redirecionado para a plataforma de compras."
  }
];

export default function FAQModal({ open, onOpenChange }: FAQModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-7 w-7 text-accent" />
            <DialogTitle className="font-headline text-2xl">Guias e FAQ</DialogTitle>
          </div>
          <DialogDescription>
            Encontre respostas para perguntas frequentes e guias de utilização do portal.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto pr-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-left font-body font-semibold">{item.question}</AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
