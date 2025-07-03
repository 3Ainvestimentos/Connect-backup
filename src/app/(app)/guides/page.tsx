import { PageHeader } from '@/components/layout/PageHeader';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


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


export default function GuidesPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader 
        title="Guias e FAQ" 
        icon={HelpCircle}
        description="Encontre respostas para perguntas frequentes e guias de utilização do portal."
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

    </div>
  );
}
