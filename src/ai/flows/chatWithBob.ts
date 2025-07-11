
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {knowledgeBaseSearch, KnowledgeBaseSearchInput} from './knowledge-base-search';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatWithBobInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The conversation history."),
  message: z.string().describe("The latest user message."),
});
export type ChatWithBobInput = z.infer<typeof ChatWithBobInputSchema>;

const ChatWithBobOutputSchema = z.object({
  reply: z.string().describe("Bob's reply to the user."),
});
export type ChatWithBobOutput = z.infer<typeof ChatWithBobOutputSchema>;

export async function chatWithBob(input: ChatWithBobInput): Promise<ChatWithBobOutput> {
  return chatWithBobFlow(input);
}

const chatWithBobFlow = ai.defineFlow(
  {
    name: 'chatWithBobFlow',
    inputSchema: ChatWithBobInputSchema,
    outputSchema: ChatWithBobOutputSchema,
  },
  async (input) => {
    const { history, message } = input;
    let knowledgeBaseContext = "";

    const searchKeywords = ["documento", "política", "diretriz", "informação sobre", "me diga sobre", "o que é", "procure por", "encontre"];
    const shouldSearch = searchKeywords.some(keyword => message.toLowerCase().includes(keyword));

    if (shouldSearch) {
      try {
        // Cast to KnowledgeBaseSearchInput to satisfy the imported type.
        // The actual input to knowledgeBaseSearch is just { query: string }.
        const searchResult = await knowledgeBaseSearch({ query: message } as KnowledgeBaseSearchInput);
        if (searchResult.results && searchResult.results.length > 0) {
          knowledgeBaseContext = "Informação relevante da base de conhecimento: \n" + searchResult.results.join("\n");
        } else {
          knowledgeBaseContext = "Nenhuma informação específica encontrada na base de conhecimento para sua consulta.";
        }
      } catch (error) {
        console.error("Error searching knowledge base:", error);
        knowledgeBaseContext = "Houve um problema ao acessar a base de conhecimento.";
      }
    }

    const systemPrompt = `Você é Bob, um assistente de IA prestativo para o 3A RIVA Connect. Seja amigável, profissional e conciso.
    Se informações da base de conhecimento forem fornecidas, use-as para formular sua resposta. Caso contrário, responda com seu conhecimento geral.`;
    
    const messagesForLLM: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let userMessageWithContext = message;
    if (knowledgeBaseContext) {
      userMessageWithContext = `${knowledgeBaseContext}\n\nConsulta do usuário: ${message}\n\nCom base nas informações acima (se houver) e em seu conhecimento geral, responda à consulta do usuário.`;
    }
    messagesForLLM.push({ role: 'user', content: userMessageWithContext });
    
    // Type assertion for messages to match Genkit's expectation if needed, or ensure ChatMessage matches.
    // For Genkit, message roles are typically 'user', 'model' (or 'assistant'), 'system', 'tool'.
    // We've defined ChatMessageSchema with 'user', 'assistant', 'system'.
    // The ai.model().generate() call expects messages in a specific format.
    // Let's map 'assistant' to 'model' for the LLM if that's what Genkit's Gemini plugin expects.
    // However, standard OpenAI/Gemini APIs often accept 'assistant'. Assuming 'assistant' is fine.
    
    const llmResponse = await ai.model('googleai/gemini-2.0-flash').generate({
      // @ts-ignore // Genkit might have a more specific type, but this structure is common
      messages: messagesForLLM.map(m => ({...m, role: m.role === 'assistant' ? 'model' : m.role})), // Map assistant to model if required
    });

    const reply = llmResponse.choices[0]?.message?.content || "Desculpe, não consegui processar sua solicitação no momento.";
    return { reply };
  }
);
