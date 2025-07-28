
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CalendarDays, PlusCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const eventSchema = z.object({
  summary: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string(),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string(),
  }),
});

type EventFormValues = z.infer<typeof eventSchema>;
type GapiEvent = gapi.client.calendar.Event;

const TIME_ZONE = 'America/Sao_Paulo';

export default function GoogleCalendar() {
  const { user, getAccessToken } = useAuth();
  const [events, setEvents] = useState<GapiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GapiEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const form = useForm({
    resolver: zodResolver(eventSchema),
  });

  const loadGapiClient = useCallback(() => {
    const checkGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            });
            setIsClientLoaded(true);
          } catch (err) {
            console.error("Error initializing gapi client:", err);
            toast({ title: 'Erro de API', description: 'Não foi possível carregar a API do Google Calendar.', variant: 'destructive' });
          }
        });
      } else {
        setTimeout(checkGapi, 100);
      }
    };
    checkGapi();
  }, []);

  useEffect(() => {
    loadGapiClient();
  }, [loadGapiClient]);

  const fetchEvents = useCallback(async (month: Date) => {
    if (!isClientLoaded || !user) return;
    setLoading(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
          throw new Error("Não foi possível obter o token de acesso.");
      }
      window.gapi.client.setToken({ access_token: accessToken });

      const timeMin = startOfMonth(month).toISOString();
      const timeMax = endOfMonth(month).toISOString();
      
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      setEvents(response.result.items || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({ title: 'Erro ao buscar eventos', description: 'Não foi possível carregar os eventos da sua agenda.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isClientLoaded, user, getAccessToken]);

  useEffect(() => {
    if (isClientLoaded && user) {
        fetchEvents(currentMonth);
    }
  }, [isClientLoaded, user, fetchEvents, currentMonth]);

  const eventDates = useMemo(() => events.map(e => new Date(e.start?.dateTime || e.start?.date || '')), [events]);

  const openModalForNew = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    const startDateTime = new Date(date);
    startDateTime.setHours(9, 0, 0, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(10, 0, 0, 0);
    
    form.reset({
      summary: '',
      description: '',
      start: { dateTime: startDateTime.toISOString(), timeZone: TIME_ZONE },
      end: { dateTime: endDateTime.toISOString(), timeZone: TIME_ZONE },
    });
    setIsModalOpen(true);
  };
  
  const openModalForEdit = (event: GapiEvent) => {
    setSelectedEvent(event);
    const startDate = new Date(event.start?.dateTime || event.start?.date || '');
    const endDate = new Date(event.end?.dateTime || event.end?.date || '');
    setSelectedDate(startDate);
    
    form.reset({
        summary: event.summary || '',
        description: event.description || '',
        start: { dateTime: startDate.toISOString(), timeZone: TIME_ZONE },
        end: { dateTime: endDate.toISOString(), timeZone: TIME_ZONE },
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Token de acesso inválido.");
      window.gapi.client.setToken({ access_token: accessToken });

      if (selectedEvent) { // Editing
        await window.gapi.client.calendar.events.update({
          calendarId: 'primary',
          eventId: selectedEvent.id!,
          resource: data,
        });
        toast({ title: 'Evento atualizado!' });
      } else { // Creating
        await window.gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: data,
        });
        toast({ title: 'Evento criado!' });
      }
      setIsModalOpen(false);
      fetchEvents(currentMonth);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Erro ao salvar evento', variant: 'destructive' });
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const handleTimeChange = (field: 'start.dateTime' | 'end.dateTime', timeValue: string) => {
    const currentIsoDate = form.getValues(field);
    if (!currentIsoDate || !timeValue) return;

    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDate = new Date(currentIsoDate);
    
    if (isValid(newDate) && !isNaN(hours) && !isNaN(minutes)) {
        newDate.setHours(hours, minutes);
        form.setValue(field, newDate.toISOString());
    }
  };

  const startTime = form.watch('start.dateTime');
  const endTime = form.watch('end.dateTime');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}
        {!loading && (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(day) => day && openModalForNew(day)}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              className="rounded-md border"
              modifiers={{ event: eventDates }}
              modifiersClassNames={{
                event: 'bg-primary/20 rounded-full',
                today: 'bg-muted-foreground/40 text-foreground rounded-full',
              }}
              locale={ptBR}
              footer={
                <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => openModalForNew(new Date())}><PlusCircle className="mr-2 h-4 w-4"/> Novo Evento</Button>
                </div>
              }
            />
             <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                {events.map(event => (
                    <div key={event.id} className="text-sm p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => openModalForEdit(event)}>
                        <p className="font-semibold">{event.summary}</p>
                        <p className="text-xs text-muted-foreground">
                            {event.start?.dateTime && isValid(parseISO(event.start.dateTime)) ? format(parseISO(event.start.dateTime), 'HH:mm') : ''} - {event.end?.dateTime && isValid(parseISO(event.end.dateTime)) ? format(parseISO(event.end.dateTime), 'HH:mm') : ''}
                        </p>
                    </div>
                ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>
              {selectedDate ? `Para o dia ${format(selectedDate, 'dd/MM/yyyy', {locale: ptBR})}` : ''}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Título</Label>
              <Input id="summary" {...form.register('summary')} />
              {form.formState.errors.summary && <p className="text-sm text-destructive">{form.formState.errors.summary.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Início</Label>
                    <Input 
                      type="time" 
                      defaultValue={startTime && isValid(parseISO(startTime)) ? format(parseISO(startTime), 'HH:mm') : ''}
                      onChange={e => handleTimeChange('start.dateTime', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input 
                      type="time" 
                      defaultValue={endTime && isValid(parseISO(endTime)) ? format(parseISO(endTime), 'HH:mm') : ''}
                      onChange={e => handleTimeChange('end.dateTime', e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Salvar Evento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
