
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { GoogleEventModal } from './GoogleEventModal';

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
  }
}

export default function GoogleCalendar() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const listMonthEvents = useCallback(async (month: Date) => {
    if (!user || !accessToken) {
      if (!user) setError("Usuário não autenticado.");
      else if (!accessToken) setError("Token de acesso não encontrado. Por favor, atualize a página.");
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

  useEffect(() => {
    if (typeof window.gapi === 'undefined' || typeof window.gapi.load === 'undefined') {
        setError("A biblioteca de cliente do Google não pôde ser carregada.");
        setIsLoading(false);
        return;
    }
    
    const initializeGapiClient = () => {
      window.gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      }).then(() => {
          if (user && accessToken) {
              listMonthEvents(currentMonth);
          } else if (!user) {
            setIsLoading(false);
          }
      }).catch((e: any) => {
           setError("Falha ao inicializar o cliente GAPI.");
           setIsLoading(false);
      });
    }

    if (window.gapi.client) {
      initializeGapiClient();
    } else {
      window.gapi.load('client', initializeGapiClient);
    }
  }, [user, accessToken, listMonthEvents, currentMonth]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
      setSelectedEvent(event);
      setSelectedDate(null);
      setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleMonthChange = (month: Date) => {
      setCurrentMonth(month);
  };

  const handleSave = async (eventData: Partial<CalendarEvent>) => {
    if (!accessToken) return;
    window.gapi.client.setToken({ access_token: accessToken });

    const calendarId = 'primary';
    try {
        if (eventData.id) { // Update existing event
            await window.gapi.client.calendar.events.update({
                calendarId,
                eventId: eventData.id,
                resource: eventData,
            });
        } else { // Create new event
             await window.gapi.client.calendar.events.insert({
                calendarId,
                resource: eventData,
            });
        }
        setIsModalOpen(false);
        listMonthEvents(currentMonth); // Refresh events for the current month
    } catch (error) {
        console.error('Error saving event:', error);
        setError('Não foi possível salvar o evento.');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!accessToken) return;
    window.gapi.client.setToken({ access_token: accessToken });
    try {
        await window.gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        setIsModalOpen(false);
        listMonthEvents(currentMonth); // Refresh
    } catch (error) {
        console.error('Error deleting event:', error);
        setError('Não foi possível deletar o evento.');
    }
  };

  const eventDates = useMemo(() => events.map(e => new Date(e.start.dateTime || e.start.date)), [events]);

  const eventsToday = useMemo(() => {
    const today = new Date();
    return events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date), today));
  }, [events]);

  return (
    <Card className="shadow-sm flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
        <Button size="sm" onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
        </Button>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(day) => day && handleDayClick(day)}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            className="rounded-md border"
            modifiers={{ event: eventDates }}
            modifiersClassNames={{
              event: 'bg-primary/20 rounded-full',
              today: 'bg-accent text-accent-foreground rounded-full',
            }}
            locale={ptBR}
          />
        <div className="flex-grow min-h-0">
          <h3 className="text-sm font-semibold mb-2">Eventos de Hoje</h3>
          <ScrollArea className="h-40">
              {isLoading ? (
                <div className="space-y-2 pr-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive text-sm p-4">
                  <AlertCircle className="mx-auto h-6 w-6 mb-1"/>
                  <p>{error}</p>
                </div>
              ) : eventsToday.length > 0 ? (
                <ul className="space-y-2 pr-4">
                  {eventsToday.map((event) => {
                    const startDate = new Date(event.start.dateTime || event.start.date);
                    return (
                        <li key={event.id} onClick={() => handleEventClick(event)} className="flex items-center gap-3 text-sm p-2 rounded-md hover:bg-muted cursor-pointer">
                            <div className="font-semibold text-primary w-12 flex-shrink-0">
                                {event.start.dateTime ? format(startDate, 'HH:mm') : 'Dia todo'}
                            </div>
                            <div className="flex-grow border-l-2 border-border pl-3 truncate">
                                <p className="font-semibold truncate">{event.summary}</p>
                            </div>
                        </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum evento para hoje.</p>
              )}
          </ScrollArea>
        </div>
      </CardContent>
      {isModalOpen && (
        <GoogleEventModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            event={selectedEvent}
            selectedDate={selectedDate}
            onSave={handleSave}
            onDelete={handleDelete}
        />
      )}
    </Card>
  );
}
