# Relatório Técnico: Implementação de Compartilhamento de Tela via WebRTC

## 1. Resumo Executivo

Este documento detalha todos os requisitos técnicos, de segurança e de infraestrutura necessários para implementar a funcionalidade de compartilhamento de tela via WebRTC no projeto Next.js, incluindo ajustes de configuração, novos componentes e considerações de segurança.

---

## 2. Contexto do Projeto

- **Framework**: Next.js 15.5.9 (App Router)
- **Linguagem**: TypeScript (com suporte a JavaScript via `allowJs: true`)
- **React**: 18.3.1
- **Padrão Arquitetural**: Uso extensivo de iframes para embeds externos
- **Segurança**: CSP e Permissions-Policy já configurados

---

## 3. Requisitos Técnicos

### 3.1. Suporte do Navegador

- ✅ **Chrome/Edge**: Suporte completo
- ✅ **Firefox**: Suporte completo
- ✅ **Safari**: Suporte completo (versões recentes)
- ⚠️ **Mobile**: Suporte limitado (iOS requer Safari)

### 3.2. Protocolo de Rede

- **HTTPS obrigatório** em produção (já configurado)
- **WebSocket** para signaling (se necessário para P2P)
- **STUN/TURN servers** para conexões WebRTC

---

## 4. Alterações Necessárias

### 4.1. Configuração de Segurança (`next.config.ts`)

#### 4.1.1. Permissions-Policy (Linha 82)

**Atual:**
```typescript
value: 'camera=(), microphone=(self "https://studio--studio-9152494730-25d31.us-central1.hosted.app"), geolocation=(), interest-cohort=()',
```

**Alterar para:**
```typescript
value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=(), interest-cohort=()',
```

**Motivo**: `display-capture=(self)` permite captura de tela no próprio domínio.

#### 4.1.2. Content Security Policy - connect-src (Linhas 43-44)

Adicionar servidores STUN/TURN no `connect-src`:

**Para produção (linha 43):**
```typescript
'stun:stun.l.google.com:19302',
'stun:stun1.l.google.com:19302',
'stun:stun2.l.google.com:19302',
// Se tiver servidor TURN próprio, adicionar aqui
```

**Para desenvolvimento (linha 44):**
```typescript
'stun:stun.l.google.com:19302',
'stun:stun1.l.google.com:19302',
'stun:stun2.l.google.com:19302',
```

**Motivo**: Permitir conexões com servidores STUN/TURN para estabelecer conexões WebRTC.

#### 4.1.3. Content Security Policy - media-src (Linha 40)

**Atual:**
```typescript
"media-src 'self' https://firebasestorage.googleapis.com blob:",
```

**Manter como está** (já permite `blob:` necessário para MediaStream).

---

### 4.2. Novos Arquivos a Criar

#### 4.2.1. Hook Customizado

**Arquivo**: `src/components/screen-share/useScreenShare.ts`

**Responsabilidade**:
- Gerenciar ciclo de vida do MediaStream
- Iniciar/parar compartilhamento
- Tratamento de erros
- Limpeza de recursos

**Dependências**: Nenhuma (usa APIs nativas do navegador)

#### 4.2.2. Componente de Controle

**Arquivo**: `src/components/screen-share/ScreenShareController.tsx`

**Responsabilidade**:
- UI para iniciar/parar compartilhamento
- Exibição do stream de vídeo
- Feedback visual de erros

**Dependências**:
- `@/components/ui/button` (já existe)
- `@/components/ui/alert` (já existe)
- `lucide-react` (já existe)

#### 4.2.3. Componente Visualizador (Opcional)

**Arquivo**: `src/components/screen-share/ScreenShareViewer.tsx`

**Responsabilidade**:
- Receber e exibir stream de outro usuário (se P2P)
- Controles de qualidade

**Dependências**: Mesmas do Controller

#### 4.2.4. Página Principal

**Arquivo**: `src/app/(app)/screen-share/page.tsx`

**Responsabilidade**:
- Rota da funcionalidade
- Layout da página

**Padrão**: Similar a `src/app/(app)/bi/page.tsx`

#### 4.2.5. Página Embed (Opcional - se usar iframe)

**Arquivo**: `src/app/(app)/screen-share/embed/page.tsx`

**Responsabilidade**:
- Versão isolada para iframe
- Mesma funcionalidade, sem layout externo

---

## 5. Dependências

### 5.1. Dependências Adicionais

**Nenhuma**. A implementação usa:
- APIs nativas do navegador (`navigator.mediaDevices.getDisplayMedia`)
- React hooks nativos
- Componentes UI existentes

### 5.2. Dependências Opcionais (Futuro)

Se precisar de P2P ou signaling:
- `simple-peer` ou `socket.io-client` (para comunicação entre peers)
- Servidor de signaling (WebSocket)

---

## 6. Infraestrutura

### 6.1. Servidores STUN/TURN

**Opção 1: Servidores Públicos (Gratuito, Limitado)**
- Google STUN: `stun:stun.l.google.com:19302`
- Limitações: Não funciona em todas as redes (NAT/firewall)

**Opção 2: Servidor TURN Próprio (Recomendado para Produção)**
- Twilio, Vonage, ou servidor próprio (coturn)
- Custo: Variável
- Vantagem: Maior taxa de sucesso

### 6.2. Armazenamento

Não necessário para compartilhamento em tempo real. Se precisar gravar:
- Firebase Storage (já configurado)
- Considerar limites de armazenamento e custos

---

## 7. Segurança

### 7.1. Permissões

- Usuário deve autorizar explicitamente
- Permissão por sessão (não persistente)
- Navegador mostra indicador visual

### 7.2. Isolamento

- Se usar iframe: isolar em origem própria
- CSP restritivo: apenas domínios confiáveis
- Validação de origem para comunicação entre frames

### 7.3. Dados Sensíveis

- Não armazenar streams sem consentimento
- Limpar tracks ao desmontar componentes
- Não expor credenciais em logs

### 7.4. Vulnerabilidades Conhecidas

- **XSS**: Validar inputs e usar CSP
- **Clickjacking**: `X-Frame-Options` já configurado
- **RCE**: Não aplicável (código cliente)

---

## 8. Testes

### 8.1. Testes Manuais

- [ ] Compartilhamento de tela completa
- [ ] Compartilhamento de janela específica
- [ ] Compartilhamento de aba do navegador
- [ ] Parar compartilhamento
- [ ] Tratamento de erro quando usuário nega permissão
- [ ] Tratamento quando navegador não suporta
- [ ] Limpeza de recursos ao sair da página
- [ ] Funcionamento em diferentes navegadores

### 8.2. Testes Automatizados (Opcional)

- Teste unitário do hook `useScreenShare`
- Mock de `navigator.mediaDevices`
- Teste de limpeza de recursos

---

## 9. Checklist de Implementação

### Fase 1: Configuração
- [ ] Ajustar Permissions-Policy no `next.config.ts`
- [ ] Adicionar servidores STUN no CSP `connect-src`
- [ ] Testar configuração em desenvolvimento

### Fase 2: Componentes
- [ ] Criar hook `useScreenShare.ts`
- [ ] Criar componente `ScreenShareController.tsx`
- [ ] Criar página `screen-share/page.tsx`
- [ ] Testar funcionalidade básica

### Fase 3: Refinamento
- [ ] Adicionar tratamento de erros
- [ ] Adicionar feedback visual
- [ ] Implementar limpeza de recursos
- [ ] Testar em múltiplos navegadores

### Fase 4: Opcional (P2P)
- [ ] Implementar signaling server (se necessário)
- [ ] Criar componente `ScreenShareViewer.tsx`
- [ ] Testar comunicação entre peers

---

## 10. Estimativa de Esforço

- **Configuração de segurança**: 30 minutos
- **Desenvolvimento dos componentes**: 2-3 horas
- **Testes e ajustes**: 1-2 horas
- **Total**: 4-6 horas (implementação básica)

---

## 11. Riscos e Limitações

### 11.1. Riscos Técnicos

- **Baixo**: APIs estáveis e bem suportadas
- **Navegadores antigos**: Sem suporte
- **Firewalls corporativos**: Podem bloquear WebRTC

### 11.2. Limitações

- Requer HTTPS em produção
- Permissão do usuário obrigatória
- Performance depende da conexão
- Mobile: Suporte limitado (especialmente iOS)

### 11.3. Mitigações

- Verificar suporte antes de usar
- Mensagens de erro claras
- Fallback quando não suportado
- Documentação para usuários

---

## 12. Próximos Passos

1. Revisar e aprovar este relatório
2. Ajustar configurações de segurança
3. Implementar componentes básicos
4. Testar em ambiente de desenvolvimento
5. Validar em diferentes navegadores
6. Deploy em produção (após testes)

---

## 13. Referências Técnicas

- WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- Screen Capture API: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
- Permissions Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## 14. Conclusão

A implementação é **viável** e requer **alterações pontuais** nas configurações de segurança e criação de novos componentes. O projeto já possui a base necessária (TypeScript, React, Next.js, segurança configurada). As mudanças são de **baixo risco** e a funcionalidade pode ser entregue em **4-6 horas** de desenvolvimento.

**Recomendação**: Começar pela implementação básica (captura e exibição local) e, se necessário, evoluir para P2P posteriormente.

---

**Relatório gerado em**: 2025-01-27  
**Versão**: 1.0  
**Status**: Aguardando aprovação para implementação

