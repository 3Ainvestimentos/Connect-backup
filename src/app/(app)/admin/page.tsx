
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageHighlights } from '@/components/admin/ManageHighlights';
import { ManageNews } from '@/components/admin/ManageNews';
import { ManageDocuments } from '@/components/admin/ManageDocuments';
import { ManageApplications } from '@/components/admin/ManageApplications';
import { ManageLabs } from '@/components/admin/ManageLabs';
import AdminGuard from '@/components/auth/AdminGuard';


export default function AdminPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Painel do Administrador"
                    icon={Shield}
                    description="Gerencie o conteúdo da intranet."
                />
                <Tabs defaultValue="news" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <TabsTrigger value="highlights">Destaques</TabsTrigger>
                        <TabsTrigger value="news">Notícias</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="applications">Aplicações</TabsTrigger>
                        <TabsTrigger value="labs">Labs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="highlights">
                        <ManageHighlights />
                    </TabsContent>
                    <TabsContent value="news">
                        <ManageNews />
                    </TabsContent>
                    <TabsContent value="documents">
                        <ManageDocuments />
                    </TabsContent>
                    <TabsContent value="applications">
                        <ManageApplications />
                    </TabsContent>
                    <TabsContent value="labs">
                        <ManageLabs />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
