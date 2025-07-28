
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';

declare global {
    interface Window {
        gapi: any;
    }
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date: string;
  };
}

export default function GoogleCalendar() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listUpcomingEvents = useCallback(async () => {
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
      
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 5,
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
              listUpcomingEvents();
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
  }, [user, accessToken, listUpcomingEvents]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
      return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center text-destructive p-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Erro ao carregar eventos</p>
                <p className="text-xs">{error}</p>
                <Button variant="link" size="sm" onClick={listUpcomingEvents} className="text-xs mt-2 text-destructive">Tentar novamente</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl">Google Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => {
              const startDate = new Date(event.start.dateTime || event.start.date);
              return (
                <li key={event.id} className="flex items-center gap-3 text-sm">
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="font-bold text-lg text-primary">{format(startDate, 'dd')}</p>
                    <p className="text-xs uppercase text-muted-foreground">{format(startDate, 'MMM', { locale: ptBR })}</p>
                  </div>
                  <div className="flex-grow border-l-2 border-border pl-3">
                     <p className="font-semibold truncate">{event.summary}</p>
                     <p className="text-xs text-muted-foreground">
                        {event.start.dateTime ? format(startDate, 'HH:mm') : 'Dia todo'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">Nenhum evento próximo.</p>
        )}
      </CardContent>
    </Card>
  );
}
