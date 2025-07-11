
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
import Link from 'next/link';
import { Separator } from '../ui/separator';

const BobIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" fill="none" {...props}>
        <g transform="translate(0, 1.5)">
            <circle cx="12" cy="6.5" r="5.5" fill="#FFFFE0" opacity="0.3"/>
            <circle cx="12" cy="6.5" r="4.5" fill="#FFFFE0" opacity="0.5"/>
            <path d="M12 11.5C9.23858 11.5 7 9.26142 7 6.5C7 3.73858 9.23858 1.5 12 1.5C14.7614 1.5 17 3.73858 17 6.5C17 9.26142 14.7614 11.5 12 11.5Z" stroke="#374151" strokeWidth="0.75" fill="rgba(209, 213, 219, 0.3)"/>
            <path d="M10.5 7.5L11.25 5L12 7.5L12.75 5L13.5 7.5" stroke="#FFE066" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <path d="M9.5 12.5 H14.5 V14.0 H9.5 Z" fill="#6B7280" stroke="#374151" strokeWidth="0.6"/>
        <path d="M9.5 14.0 C9.5 14.5 10 14.5 10.5 14.5 H13.5 C14 14.5 14.5 14.5 14.5 14.0 L14 13.75 H10 L9.5 14.0 Z" fill="#6B7280" stroke="#374151" strokeWidth="0.6"/>
        <line x1="9.5" y1="13.0" x2="14.5" y2="13.0" stroke="#4B5563" strokeWidth="0.5"/>
        <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke="#4B5563" strokeWidth="0.5"/>
        <rect x="4" y="14.5" width="16" height="8.5" rx="3.5" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1"/>
        <rect x="2.5" y="16" width="2" height="5.5" rx="1.5" fill="#9CA3AF" stroke="#4B5563" strokeWidth="0.75"/>
        <rect x="19.5" y="16" width="2" height="5.5" rx="1.5" fill="#9CA3AF" stroke="#4B5563" strokeWidth="0.75"/>
        <circle cx="8.5" cy="18.75" r="1.8" fill="#DFB87F"/>
        <circle cx="8.0" cy="18.25" r="0.5" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="15.5" cy="18.75" r="1.8" fill="#DFB87F"/>
        <circle cx="15.0" cy="18.25" r="0.5" fill="#FFFFFF" opacity="0.9"/>
    </svg>
);


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
            <HelpCircle className="h-7 w-7 text-muted-foreground" />
            <DialogTitle className="font-headline text-2xl">Guias e FAQ</DialogTitle>
          </div>
          <DialogDescription>
            Encontre respostas para perguntas frequentes e guias de utilização do Connect
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto pr-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-left font-body font-semibold text-sm">
                  {item.question}
                </AccordionTrigger>
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
              className="block mt-4 text-center p-4 bg-background rounded-lg transition-colors hover:bg-muted/50"
            >
              <BobIcon className="mx-auto h-10 w-10 mb-2" />
              <p className="text-foreground text-sm">
                Outras dúvidas? Pergunte ao Bob
              </p>
            </Link>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="hover:bg-muted">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
