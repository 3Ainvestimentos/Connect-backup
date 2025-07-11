
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
import { HelpCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';

interface FAQModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqItems = [
  {
    question: "Como faço login na plataforma?",
    answer: "O acesso ao 3A RIVA Connect é feito exclusivamente com sua conta Google corporativa (@3ainvestimentos.com.br). Na tela de login, clique em 'Entrar com Google' e utilize suas credenciais."
  },
  {
    question: "Onde encontro os formulários de solicitação (férias, suporte, etc.)?",
    answer: "Todos os formulários e ferramentas estão centralizados na seção 'Aplicações e Suporte'. Basta clicar no card correspondente (ex: 'Solicitar Férias', 'Suporte T.I') para abrir a janela de solicitação."
  },
  {
    question: "Para que serve a seção 'Labs'?",
    answer: "A seção 'Labs' é o nosso repositório de conhecimento, onde você encontra vídeos de treinamento, painéis de estudo e outros materiais para o seu desenvolvimento contínuo."
  },
  {
    question: "Como posso usar o chatbot Bob?",
    answer: "Bob é seu assistente de IA. Você pode fazer perguntas sobre políticas da empresa, pedir para ele encontrar documentos ('procure pela política de home office'), ou até mesmo resumir uma conversa. Acesse-o pelo menu 'Bob'."
  },
  {
    question: "Posso alterar o tema da plataforma (claro/escuro)?",
    answer: "Sim! Clique no seu avatar no canto superior direito para abrir o menu do usuário. Lá, você encontrará a opção 'Tema', onde poderá escolher entre 'Claro' e 'Escuro'."
  },
  {
    question: "Como vejo as informações do meu perfil?",
    answer: "Clique no seu avatar no canto superior direito e selecione a opção 'Meu Perfil'. Uma janela será exibida com suas informações de cargo, área, líder, etc."
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
           <Separator className="my-4" />
           <Link
              href="/chatbot"
              onClick={() => onOpenChange(false)}
              className="block mt-4 text-center p-4 bg-muted rounded-lg transition-colors hover:bg-secondary"
            >
              <Sparkles className="mx-auto h-6 w-6 text-accent mb-2" />
              <p className="font-semibold text-foreground">
                Outras dúvidas? <span className="text-accent font-bold">Pergunte ao Bob</span>!
              </p>
            </Link>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
