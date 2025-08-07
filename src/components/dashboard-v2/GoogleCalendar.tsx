
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CalendarDays, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { GoogleEventDetailsModal } from './GoogleEventDetailsModal';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';


declare global {
    interface Window {
        gapi: any;
    }
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    date: string;
  };
  end: {
      dateTime: string;
      date: string;
  };
  attendees?: { email: string, displayName?: string, responseStatus: string }[];
  hangoutLink?: string;
  location?: string;
}

export default function GoogleCalendar() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const listMonthEvents = useCallback(async (month: Date) => {
    if (!user || !accessToken) {
      if (!user) setError("Usuário não autenticado.");
      else if (!accessToken) setError("Token de acesso não encontrado.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      window.gapi.client.setToken({ access_token: accessToken });
      
      const timeMin = startOfMonth(month).toISOString();
      const timeMax = endOfMonth(month).toISOString();

      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin,
        'timeMax': timeMax,
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      });

      setEvents(response.result.items || []);
      setError(null);
      
    } catch (err: any) {
      console.error("Erro ao buscar eventos do calendário:", err);
      let errorMessage = "Não foi possível carregar os eventos do calendário.";
      if (err.result?.error?.message) {
        errorMessage = `Erro da API: ${err.result.error.message}. Tente atualizar a página para renovar a permissão.`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  const initializeGapiClient = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
        if (isLoading) {
            setError("A API do Google demorou muito para responder. Verifique sua conexão ou tente novamente.");
            setIsLoading(false);
        }
    }, 10000); // 10-second timeout

    const initClient = () => {
        window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        }).then(() => {
            clearTimeout(timeout);
            listMonthEvents(currentMonth);
        }).catch((e: any) => {
            clearTimeout(timeout);
            setError("Falha ao inicializar o cliente GAPI. Tente atualizar a página.");
            setIsLoading(false);
        });
    };

    if (typeof window.gapi === 'undefined' || typeof window.gapi.load === 'undefined') {
        clearTimeout(timeout);
        setError("A biblioteca de cliente do Google não pôde ser carregada.");
        setIsLoading(false);
        return;
    }
    
    // gapi.load is the first step.
    window.gapi.load('client', initClient);
  }, [listMonthEvents, currentMonth, isLoading]);

  useEffect(() => {
    if (user && accessToken) {
      initializeGapiClient();
    } else if (!user) {
        setIsLoading(false);
    }
    // Eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  const handleDayClick = (day: Date | undefined) => {
    if(day) {
        setSelectedDate(day);
    }
  };

  const handleMonthChange = (month: Date) => {
      setCurrentMonth(month);
      listMonthEvents(month);
  };
  
  const eventDates = useMemo(() => events.map(e => new Date(e.start.dateTime || e.start.date)), [events]);
  
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date), selectedDate));
  }, [events, selectedDate]);


  return (
    <>
        <Card className="shadow-sm flex flex-col h-full">
        <CardHeader>
            <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
            <CardDescription>Visualize seus próximos compromissos e eventos.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDayClick}
                    month={currentMonth}
                    onMonthChange={handleMonthChange}
                    className="rounded-md border"
                    modifiers={{ event: eventDates }}
                    modifiersClassNames={{
                        event: 'bg-muted rounded-full',
                        today: 'bg-muted-foreground/40 text-foreground font-bold',
                    }}
                    locale={ptBR}
                />
            </div>
            <div className="flex-grow min-h-0">
            <h3 className="text-sm font-semibold mb-2">
                Eventos de {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'hoje'}
            </h3>
            <ScrollArea className="h-40">
                {isLoading ? (
                    <div className="space-y-2 pr-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center text-destructive text-sm p-4 flex flex-col items-center gap-2">
                      <AlertCircle className="mx-auto h-6 w-6"/>
                      <p>{error}</p>
                      <Button variant="link" size="sm" onClick={initializeGapiClient} className="text-xs text-destructive">Tentar novamente</Button>
                    </div>
                ) : eventsForSelectedDay.length > 0 ? (
                    <ul className="space-y-2 pr-4">
                    {eventsForSelectedDay.map((event) => {
                        const startDate = new Date(event.start.dateTime || event.start.date);
                        const endDate = new Date(event.end.dateTime || event.end.date);
                        const isAllDay = !event.start.dateTime;
                        
                        const timeFormat = isAllDay 
                          ? 'Dia todo'
                          : `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;

                        return (
                            <li key={event.id} className="flex items-center gap-3 text-sm p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => setSelectedEvent(event)}>
                                <div className={cn("font-semibold text-foreground w-24 flex-shrink-0 text-center", isAllDay && 'text-muted-foreground')}>
                                    {timeFormat}
                                </div>
                                <div className="flex-grow border-l-2 border-border pl-3 truncate">
                                    <p className="font-semibold truncate">{event.summary}</p>
                                </div>
                            </li>
                        );
                    })}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">Nenhum evento para este dia.</p>
                )}
            </ScrollArea>
            </div>
        </CardContent>
        </Card>
        <GoogleEventDetailsModal
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
            event={selectedEvent}
        />
    </>
  );
}
