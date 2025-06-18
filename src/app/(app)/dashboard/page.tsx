
"use client"; 

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { UserCircle, Zap, Briefcase, Building, Phone } from 'lucide-react';

const whatsNewItems = [
  {
    title: 'Employee Happiness Conference 2023',
    description: 'Registration is on',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'conference team',
    link: '#', 
    gridClass: 'md:col-span-1 md:row-span-1',
  },
  {
    title: 'New well-being packages',
    description: 'Discover our new offerings',
    imageUrl: 'https://placehold.co/800x800.png', 
    dataAiHint: 'wellness nature',
    link: '#', 
    gridClass: 'md:col-span-1 md:row-span-2',
  },
  {
    title: 'Bring your dog to the office day is back!',
    description: 'Prepare for paw-sitivity',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'dog office',
    link: '#', 
    gridClass: 'md:col-span-1 md:row-span-1',
  },
];

const applications = [
  { name: 'My Profile', icon: UserCircle, href: '#' },
  { name: 'Safe Ag', icon: Zap, href: '#' },
  { name: 'Jira', icon: Briefcase, href: '#' },
  { name: 'Wall', icon: Building, href: '#' },
];

const contacts = [
  { name: 'Martin Coles', phone: '+000 111 222 333', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait' },
  { name: 'Adrien Wilson', phone: '+000 444 555 666', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait' },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8 px-8 sm:px-12 md:px-16">
      <section>
        <h2 className="text-3xl font-headline font-bold mb-6 text-foreground">What's new</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-rows-2" style={{ minHeight: '450px' }}>
          
          <div className="flex flex-col gap-6">
            <Link href={whatsNewItems[0].link} className="relative h-full rounded-lg overflow-hidden group shadow-lg block">
              <Image
                src={whatsNewItems[0].imageUrl}
                alt={whatsNewItems[0].title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={whatsNewItems[0].dataAiHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[0].title}</h3>
                <p className="text-sm text-gray-200 font-body">{whatsNewItems[0].description}</p>
              </div>
            </Link>
            <Link href={whatsNewItems[2].link} className="relative h-full rounded-lg overflow-hidden group shadow-lg block">
              <Image
                src={whatsNewItems[2].imageUrl}
                alt={whatsNewItems[2].title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={whatsNewItems[2].dataAiHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[2].title}</h3>
                <p className="text-sm text-gray-200 font-body">{whatsNewItems[2].description}</p>
              </div>
            </Link>
          </div>
          
          <Link href={whatsNewItems[1].link} className={`${whatsNewItems[1].gridClass} relative rounded-lg overflow-hidden group shadow-lg block`}>
            <Image
              src={whatsNewItems[1].imageUrl}
              alt={whatsNewItems[1].title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={whatsNewItems[1].dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[1].title}</h3>
              <p className="text-sm text-gray-200 font-body">{whatsNewItems[1].description}</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md p-0 [&_button]:text-xs [&_caption_label]:text-sm"
              month={date} 
              onMonthChange={setDate} 
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Applications</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {applications.map((app) => (
              <Button key={app.name} variant="outline" className="flex flex-col items-center justify-center h-24 p-2 text-center font-body hover:bg-primary/5 border-border text-foreground hover:text-primary" asChild>
                <Link href={app.href}>
                  <app.icon className="h-7 w-7 mb-1.5 text-primary/80 group-hover:text-primary" />
                  <span className="text-xs">{app.name}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.name} className="flex items-center gap-3 p-2.5 hover:bg-muted/40 rounded-lg transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint={contact.dataAiHint} />
                  <AvatarFallback>{contact.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold font-body text-sm text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center">
                    <Phone className="h-3 w-3 mr-1.5"/>
                    {contact.phone}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
