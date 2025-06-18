'use server';

/**
 * @fileOverview Classifies documents based on their content for easy organization and retrieval.
 *
 * - classifyDocument - A function that classifies the document.
 * - ClassifyDocumentInput - The input type for the classifyDocument function.
 * - ClassifyDocumentOutput - The return type for the classifyDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyDocumentInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document to be classified.'),
});
export type ClassifyDocumentInput = z.infer<typeof ClassifyDocumentInputSchema>;

const ClassifyDocumentOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of tags that describe the document.'),
  classificationConfidence: z
    .number()
    .describe('A numerical value between 0 and 1 indicating the confidence level of the classification.'),
});
export type ClassifyDocumentOutput = z.infer<typeof ClassifyDocumentOutputSchema>;

export async function classifyDocument(input: ClassifyDocumentInput): Promise<ClassifyDocumentOutput> {
  return classifyDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyDocumentPrompt',
  input: {schema: ClassifyDocumentInputSchema},
  output: {schema: ClassifyDocumentOutputSchema},
  prompt: `You are an expert document classifier.  Given the document content, classify it and provide an array of relevant tags and a confidence score.

Document Content: {{{documentContent}}}

Output should be a JSON object with "tags" and "classificationConfidence" fields.
`,
});

const classifyDocumentFlow = ai.defineFlow(
  {
    name: 'classifyDocumentFlow',
    inputSchema: ClassifyDocumentInputSchema,
    outputSchema: ClassifyDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
