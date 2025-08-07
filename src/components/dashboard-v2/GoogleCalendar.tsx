
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const { user, accessToken, signOut } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const listMonthEvents = useCallback(async (month: Date) => {
    if (!user || !accessToken) {
      if (!user) setError("Usuário não autenticado.");
      else if (!accessToken) setError("Token de acesso expirado. Por favor, faça login novamente.");
      return;
    }
    
    setError(null);
    setEvents([]);
    
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
      
      // If the response is there but the items are missing, it might be an auth issue.
      if (!response || !response.result) {
          throw new Error("A resposta da API do Google Calendar foi inválida ou nula.");
      }
      setEvents(response.result.items || []);

    } catch (err: any) {
      console.error("Erro ao buscar eventos do calendário:", err);
      setError("Ocorreu um erro ao carregar os eventos. Por favor, saia e faça login novamente para reautenticar.");
    }
  }, [user, accessToken]);

  const initializeGapiClient = useCallback(() => {
    setError(null);
    try {
      if (typeof window.gapi === 'undefined' || typeof window.gapi.load === 'undefined') {
        throw new Error("A biblioteca de cliente do Google não pôde ser carregada.");
      }
      
      const init = () => {
         window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          }).then(() => {
              listMonthEvents(currentMonth);
          }).catch((e: any) => {
              console.error("Erro ao inicializar o cliente GAPI:", e);
              setError("Falha ao inicializar a API do Google. Por favor, saia e faça login novamente para reautenticar.");
          });
      };
      
      window.gapi.load('client', init);

    } catch (e: any) {
        console.error("Falha ao carregar GAPI:", e);
        setError("Não foi possível carregar a API do Google. Por favor, saia e faça login novamente para reautenticar.");
    }
  }, [listMonthEvents, currentMonth]);


  useEffect(() => {
    if (user && accessToken) {
        // A simple check to see if the gapi client is loaded.
        if (window.gapi && window.gapi.client) {
            listMonthEvents(currentMonth);
        } else {
            initializeGapiClient();
        }
    } else if (!user) {
        setError("Usuário não autenticado.");
    }
  }, [user, accessToken, currentMonth, listMonthEvents, initializeGapiClient]); 

  const handleDayClick = (day: Date | undefined) => {
    if(day) {
        setSelectedDate(day);
    }
  };

  const handleMonthChange = (month: Date) => {
      setCurrentMonth(month);
  };
  
  const eventDates = useMemo(() => events.map(e => new Date(e.start.dateTime || e.start.date)), [events]);
  
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date), selectedDate));
  }, [events, selectedDate]);


  const renderEvents = () => {
    if (error) return null;

    if (eventsForSelectedDay.length > 0) {
        return (
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
        )
    }
    
    return <p className="text-center text-muted-foreground text-sm py-4">Nenhum evento para este dia.</p>;
  }

  return (
    <>
        <Card className="shadow-sm flex flex-col h-full">
        <CardHeader>
            <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
            <CardDescription>Visualize seus próximos compromissos e eventos.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          {error ? (
            <div className="flex flex-col items-center justify-center text-center text-destructive p-4 h-full">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Falha ao carregar</p>
                <p className="text-sm">{error}</p>
                <Button variant="destructive" size="sm" onClick={signOut} className="mt-2 text-xs">Fazer Login Novamente</Button>
            </div>
          ) : (
             <>
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
                    {renderEvents()}
                </ScrollArea>
                </div>
            </>
          )}
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
