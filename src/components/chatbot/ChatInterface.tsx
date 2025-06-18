
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Send, User, Loader2, Sparkles, FileText, Tags } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatWithBob, ChatMessage as ChatMessageType, ChatWithBobInput } from '@/ai/flows/chatWithBob';
import { summarizeDocument, SummarizeDocumentInput } from '@/ai/flows/chatbot-summarization';
import { classifyDocument, ClassifyDocumentInput } from '@/ai/flows/chatbot-classification';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  avatar?: string;
  name?: string;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Add initial greeting from Bob
  useEffect(() => {
    setMessages([
      { id: crypto.randomUUID(), role: 'assistant', content: "Olá! Sou Bob, seu assistente virtual. Como posso ajudar hoje?", name: "Bob" }
    ]);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      avatar: user?.photoURL || undefined,
      name: user?.displayName || "Usuário"
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory: ChatMessageType[] = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Only user/assistant for history
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await chatWithBob({
        history: chatHistory,
        message: userMessage.content
      } as ChatWithBobInput); // Cast to satisfy the imported type

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        name: "Bob"
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling chatWithBob:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        name: "Bob"
      };
      setMessages(prev => [...prev, errorMessage]);
       toast({
        title: "Erro no Chatbot",
        description: "Não foi possível obter uma resposta do Bob.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSummarizeChat = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const chatContent = messages.map(msg => `${msg.name || msg.role}: ${msg.content}`).join('\n');
    try {
      const result = await summarizeDocument({ documentContent: chatContent } as SummarizeDocumentInput);
      const summaryMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Resumo da conversa:\n${result.summary}`,
        name: "Sistema"
      };
      setMessages(prev => [...prev, summaryMessage]);
      toast({ title: "Conversa Resumida", description: "O resumo foi adicionado ao chat." });
    } catch (error) {
      console.error("Error summarizing chat:", error);
      toast({ title: "Erro ao Resumir", description: "Não foi possível resumir a conversa.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassifyChat = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const chatContent = messages.map(msg => msg.content).join(' ');
    try {
      const result = await classifyDocument({ documentContent: chatContent } as ClassifyDocumentInput);
      const classificationMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Tópicos da conversa (Confiança: ${(result.classificationConfidence * 100).toFixed(0)}%):\n${result.tags.join(', ')}`,
        name: "Sistema"
      };
      setMessages(prev => [...prev, classificationMessage]);
      toast({ title: "Conversa Classificada", description: "A classificação foi adicionada ao chat." });
    } catch (error) {
      console.error("Error classifying chat:", error);
      toast({ title: "Erro ao Classificar", description: "Não foi possível classificar a conversa.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="flex flex-col flex-grow shadow-lg overflow-hidden">
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {msg.name === "Bob" ? <Bot size={18} /> : <Sparkles size={18} />}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-xl shadow font-body ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 
                  msg.role === 'assistant' ? 'bg-muted text-foreground rounded-bl-none' :
                  'bg-accent/20 text-accent-foreground rounded-none border border-accent italic'
                }`}
              >
                {msg.role !== 'system' && <p className="text-xs font-semibold mb-1">{msg.name || (msg.role === 'user' ? 'Você' : 'Bob')}</p>}
                {/* Basic markdown-like rendering for newlines */}
                {msg.content.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              {msg.role === 'user' && user && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={18}/>}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length -1].role === 'user' && (
            <div className="flex items-end gap-2 mb-4 justify-start">
              <Avatar className="h-8 w-8">
                 <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18} /></AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] p-3 rounded-lg shadow bg-muted text-foreground rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={handleSummarizeChat} disabled={isLoading || messages.length < 2} className="font-body">
              <FileText className="mr-2 h-4 w-4" /> Resumir Conversa
            </Button>
            <Button variant="outline" size="sm" onClick={handleClassifyChat} disabled={isLoading || messages.length < 2} className="font-body">
              <Tags className="mr-2 h-4 w-4" /> Classificar Tópicos
            </Button>
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem para Bob..."
              className="flex-grow resize-none font-body"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              aria-label="Mensagem para Bob"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Enviar mensagem">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
