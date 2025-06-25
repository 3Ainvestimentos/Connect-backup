
"use client"; 

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users, CakeSlice, BrainCircuit, Wine, TrendingUp, Clock, 
  Megaphone, MessageSquare, CalendarDays, Check, LayoutGrid,
  UserCircle, MessagesSquare as SlackIcon, BookUser, Plane, Headset, Briefcase,
  Megaphone as MarketingIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import VacationRequestModal from '@/components/applications/VacationRequestModal';
import SupportModal from '@/components/applications/SupportModal';
import AdminModal from '@/components/applications/AdminModal';
import MarketingModal from '@/components/applications/MarketingModal';

const whatsNewItems = [
  {
    title: 'Conferência de Felicidade do Colaborador',
    description: 'Inscrições abertas',
    imageUrl: 'https://i.ibb.co/nszMYNWJ/carreira-felicidade-corporativa.jpg',
    dataAiHint: 'conference team',
    link: '#',
  },
  {
    title: 'Novos pacotes de bem-estar',
    description: 'Descubra nossas novas ofertas',
    imageUrl: 'https://i.ibb.co/mrC2Tr5b/homem-correndo-na-estrada-contra-as-montanhas-durante-o-por-do-sol-1048944-7722076.jpg', 
    dataAiHint: 'wellness running',
    link: '#',
  },
  {
    title: 'O dia de trazer seu cão para o escritório está de volta!',
    description: 'Prepare-se para a fofura!',
    imageUrl: 'https://i.ibb.co/SpBph6N/1-photo-1535930749574-1399327ce78f-303764.jpg',
    dataAiHint: 'dog office',
    link: '#',
  },
];

const events: { title: string; time: string; icon: LucideIcon }[] = [
    { title: "Reunião de Alinhamento Semanal", time: "10:00 - 11:00", icon: Users },
    { title: "Aniversário da Empresa", time: "Dia Todo", icon: CakeSlice },
    { title: "Workshop de Design Thinking", time: "14:00 - 16:00", icon: BrainCircuit },
    { title: "Happy Hour de Fim de Mês", time: "A partir das 17:30", icon: Wine },
    { title: "Apresentação de Resultados Q2", time: "09:00 - 10:00", icon: TrendingUp },
];

const initialMessages = [
  { id: '1', title: 'Atualização da Política de Férias', content: 'Lembrete: A nova política de férias entrará em vigor a partir de 1º de Agosto. Todos os colaboradores devem revisar o documento disponível na intranet para entender as mudanças nos processos de solicitação e aprovação. O documento detalha os novos períodos aquisitivos e as regras para venda de dias de férias. Qualquer dúvida, entre em contato com o departamento de RH.', sender: 'RH', date: '2024-07-25', isRead: false },
  { id: '2', title: 'Confraternização de Fim de Mês', content: 'Não se esqueçam do nosso happy hour amanhã, às 17h30! Teremos petiscos, bebidas e música ao vivo no terraço. Contamos com a presença de todos!', sender: 'Comunicação', date: '2024-07-24', isRead: false },
  { id: '3', title: 'Manutenção Programada', content: 'O sistema de TI passará por uma manutenção no sábado, das 8h às 12h. Durante este período, o acesso aos servidores de arquivos e ao sistema de CRM poderá ficar indisponível.', sender: 'Suporte TI', date: '2024-07-22', isRead: true },
  { id: '4', title: 'Pesquisa de Clima Organizacional', content: 'Sua opinião é muito importante! Por favor, responda à pesquisa de clima até o final desta semana. O link foi enviado para o seu e-mail. A participação é anônima.', sender: 'RH', date: '2024-07-26', isRead: false },
  { id: '5', title: 'Nova Máquina de Café na Copa', content: 'Boas notícias para os amantes de café! Instalamos uma nova máquina de café expresso na copa do 2º andar. Aproveitem!', sender: 'Administrativo', date: '2024-07-26', isRead: true },
  { id: '6', title: 'Exercício de Evacuação de Emergência', content: 'Realizaremos um exercício de evacuação de emergência na próxima quarta-feira, às 15h. A participação de todos é obrigatória. Por favor, familiarize-se com as rotas de fuga mais próximas da sua estação de trabalho. Mais instruções serão dadas pelos líderes de cada andar no dia do exercício.', sender: 'Segurança', date: '2024-07-27', isRead: false },
  { id: '7', title: 'Resultados do Q2', content: 'A apresentação dos resultados do segundo trimestre será na sexta-feira às 10h na sala de reuniões principal. Venha conferir o crescimento da empresa e os próximos passos.', sender: 'Diretoria', date: '2024-07-28', isRead: false },
  { id: '8', title: 'Campanha do Agasalho', content: 'A campanha do agasalho está na reta final! As doações podem ser entregues na caixa da recepção até amanhã. Sua contribuição faz a diferença!', sender: 'Comunicação', date: '2024-07-29', isRead: true },
];

type Message = (typeof initialMessages)[0];

interface AppLink {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
}

const applicationsList: AppLink[] = [
  { id: 'profile', name: 'Meu Perfil', icon: UserCircle, href: '#' },
  { id: 'slack', name: 'Slack', icon: SlackIcon, href: '#' },
  { id: 'vacation', name: 'Férias', icon: Plane, href: '#' },
  { id: 'support', name: 'Suporte TI', icon: Headset, href: '#' },
  { id: 'admin', name: 'Administrativo', icon: Briefcase, href: '#' },
  { id: 'marketing', name: 'Marketing', icon: MarketingIcon, href: '#' },
];

export default function DashboardPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);

  const [isVacationModalOpen, setIsVacationModalOpen] = React.useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = React.useState(false);
  
  const unreadCount = React.useMemo(() => messages.filter(msg => !msg.isRead).length, [messages]);

  const handleViewMessage = (messageToView: Message) => {
    setMessages(currentMessages =>
      currentMessages.map(m =>
        m.id === messageToView.id ? { ...m, isRead: true } : m
      )
    );
    setSelectedMessage({ ...messageToView, isRead: true });
  };
  
  const handleAppClick = (appId: string) => {
    switch (appId) {
      case 'vacation': setIsVacationModalOpen(true); break;
      case 'support': setIsSupportModalOpen(true); break;
      case 'admin': setIsAdminModalOpen(true); break;
      case 'marketing': setIsMarketingModalOpen(true); break;
      default: break;
    }
  };

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <section>
          <PageHeader
            title={<Link href="/news" className="hover:underline">O que há de novo</Link>}
            icon={Megaphone}
            description="Veja os últimos anúncios e destaques."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-3" style={{ minHeight: '450px' }}>
            <Link href={whatsNewItems[0].link} className="relative rounded-lg overflow-hidden group block">
              <Image src={whatsNewItems[0].imageUrl} alt={whatsNewItems[0].title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={whatsNewItems[0].dataAiHint} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[0].title}</h3>
                <p className="text-sm text-gray-200 font-body">{whatsNewItems[0].description}</p>
              </div>
            </Link>
            <Link href={whatsNewItems[1].link} className="relative md:row-span-2 rounded-lg overflow-hidden group block">
              <Image src={whatsNewItems[1].imageUrl} alt={whatsNewItems[1].title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={whatsNewItems[1].dataAiHint} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[1].title}</h3>
                <p className="text-sm text-gray-200 font-body">{whatsNewItems[1].description}</p>
              </div>
            </Link>
            <Link href={whatsNewItems[2].link} className="relative rounded-lg overflow-hidden group block">
              <Image src={whatsNewItems[2].imageUrl} alt={whatsNewItems[2].title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={whatsNewItems[2].dataAiHint} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[2].title}</h3>
                <p className="text-sm text-gray-200 font-body">{whatsNewItems[2].description}</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          
          <Card className="shadow-sm flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-accent"/>
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        month={date}
                        onMonthChange={setDate}
                    />
                </div>
                <div className="relative min-h-[300px] md:min-h-0">
                    <ScrollArea className="absolute inset-0 pr-4">
                        <div className="space-y-4">
                        {events.map((event, index) => (
                            <div key={index} className="flex items-start gap-4 p-3 bg-muted/40 rounded-lg">
                            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center h-10 w-10">
                                <event.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold font-body text-sm text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1.5" />
                                {event.time}
                                </p>
                            </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm flex flex-col lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-foreground text-xl flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-accent" />
                    <span>Mensagens</span>
                  </div>
                  {unreadCount > 0 && (<Badge variant="default">{unreadCount}</Badge>)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                      {messages.map((msg) => (
                          <div key={msg.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewMessage(msg)}>
                              <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <Checkbox checked={msg.isRead} disabled className="pointer-events-none" aria-label={msg.isRead ? "Mensagem lida" : "Mensagem não lida"} />
                                      <div className={cn("font-body text-sm text-foreground truncate", { 'font-bold': !msg.isRead })}>{msg.title}</div>
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap pl-1">{new Date(msg.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                              </div>
                              <p className={cn("text-sm text-muted-foreground font-body pl-8", { 'font-bold text-foreground': !msg.isRead, 'font-normal': msg.isRead })}>
                                {msg.content.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content}
                                {msg.content.length > 80 && <span className="text-accent font-semibold ml-1">Leia mais</span>}
                              </p>
                              <div className="flex justify-end mt-auto"><Badge variant="outline" className="font-body">{msg.sender}</Badge></div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm flex flex-col lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-accent"/>
                Aplicações
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {applicationsList.map((app) => {
                        const isModal = ['vacation', 'support', 'admin', 'marketing'].includes(app.id);
                        const Comp = isModal ? Button : 'div';
                        const linkContent = (
                            <>
                                <app.icon className="mr-4 h-6 w-6 text-accent" />
                                <span>{app.name}</span>
                            </>
                        );

                        return isModal ? (
                            <Button key={app.id} variant="outline" className="w-full justify-start h-14 p-4 text-base" onClick={() => handleAppClick(app.id)}>
                              {linkContent}
                            </Button>
                          ) : (
                            <Button key={app.id} variant="outline" className="w-full justify-start h-14 p-4 text-base" asChild>
                              <Link href={app.href}>{linkContent}</Link>
                            </Button>
                          );
                    })}
                </div>
            </CardContent>
          </Card>

        </section>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(isOpen) => !isOpen && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{selectedMessage.title}</DialogTitle>
                <DialogDescription className="text-left pt-2">De: {selectedMessage.sender}<br />Data: {new Date(selectedMessage.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</DialogDescription>
              </DialogHeader>
              <div className="py-4 text-sm text-foreground max-h-[60vh] overflow-y-auto">
                {selectedMessage.content.split('\n').map((line, index) => (<p key={index} className="mb-2 last:mb-0">{line || '\u00A0'}</p>))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <VacationRequestModal open={isVacationModalOpen} onOpenChange={setIsVacationModalOpen} />
      <SupportModal open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen} />
      <AdminModal open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen} />
      <MarketingModal open={isMarketingModalOpen} onOpenChange={setIsMarketingModalOpen} />
    </>
  );
}

    
