
import { PageHeader } from '@/components/layout/PageHeader';
import ContactsClient from '@/components/contacts/ContactsClient';
import { BookUser } from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string;
  branch: string; 
  position: string; 
  email: string;
  slack: string;
}

const mockContacts: Contact[] = [
    { id: '1', name: 'Jacob Wilkins', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait', branch: 'Berlin', position: 'Account Manager', email: 'jacob@company.com', slack: '@jacob' },
    { id: '2', name: 'Harry Weasly', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait redhead', branch: 'Berlin', position: 'Operations Manager', email: 'harry@company.com', slack: '@harry' },
    { id: '3', name: 'Laura Keith', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait blonde', branch: 'Toronto', position: 'Head of Sales', email: 'laura@company.com', slack: '@laura' },
    { id: '4', name: 'Ben Simon', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait glasses', branch: 'Berlin', position: 'Finance Lead', email: 'ben@company.com', slack: '@ben' },
    { id: '5', name: 'Kerri Chandler', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait dark hair', branch: 'London', position: 'Operations Manager', email: 'kerri@company.com', slack: '@kerri' },
    { id: '6', name: 'Julian Wan', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait asian', branch: 'New York City', position: 'Account Manager', email: 'julian@company.com', slack: '@julian' },
    { id: '7', name: 'Rachel Simpson', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait smiling', branch: 'Toronto', position: 'Sales Manager', email: 'rachel@company.com', slack: '@rachel' },
    { id: '8', name: 'Donna Hayley', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait professional', branch: 'Barcelona', position: 'Account Manager', email: 'donna@company.com', slack: '@donna' },
    { id: '9', name: 'Lee Keidis', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait serious', branch: 'Berlin', position: 'Operations Manager', email: 'lee@company.com', slack: '@lee' },
    { id: '10', name: 'Jude Law', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait handsome', branch: 'New York City', position: 'Operations Manager', email: 'jude@company.com', slack: '@jude' },
    { id: '11', name: 'Frederic Bery', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait friendly', branch: 'Manchester', position: 'Account Manager', email: 'fred@company.com', slack: '@fred' },
];


export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Contatos" 
        icon={BookUser}
        description="Encontre informações sobre os colaboradores da empresa."
      />
      <ContactsClient initialContacts={mockContacts} />
    </div>
  );
}
