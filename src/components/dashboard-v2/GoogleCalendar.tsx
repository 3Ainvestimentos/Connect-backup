
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useGapiClient } from '@/hooks/useGapiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date: string;
  };
}

export default function GoogleCalendar() {
  const { isClientReady, error: gapiError } = useGapiClient();
  const { getAccessToken, user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listUpcomingEvents = useCallback(async () => {
    if (!isClientReady || !user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Não foi possível obter o token de acesso.');
      }

      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
               apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
               clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
               discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            });

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
            resolve();
          } catch(err) {
            reject(err);
          }
        });
      });
      
    } catch (err: any) {
      console.error("Erro ao buscar eventos do calendário:", err);
      let errorMessage = "Não foi possível carregar os eventos do calendário.";
      if (err.result?.error?.message) {
        errorMessage = err.result.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isClientReady, getAccessToken, user]);

  useEffect(() => {
    if(isClientReady && user) {
        listUpcomingEvents();
    }
  }, [isClientReady, user, listUpcomingEvents]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  
  if (error || gapiError) {
      return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center text-destructive p-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Erro ao carregar eventos</p>
                <p className="text-xs">{error || gapiError?.message}</p>
                <button onClick={listUpcomingEvents} className="text-xs underline mt-2">Tentar novamente</button>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Próximos Eventos</CardTitle>
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
