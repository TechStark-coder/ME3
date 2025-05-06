
'use server';
/**
 * @fileOverview An AI flow to analyze a single image and identify objects within it.
 *
 * - analyzeImageObjects - A function that identifies objects in a single image.
 * - AnalyzeImageObjectsInput - The input type for the analyzeImageObjects function.
 * - AnalyzeImageObjectsOutput - The return type for the analyzeImageObjects function.
 */

import { ai } from '@/ai/ai-instance'; // Assuming ai-instance.ts is correctly configured
import { z } from 'genkit';

// Define the input schema using Zod
const AnalyzeImageObjectsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageObjectsInput = z.infer<typeof AnalyzeImageObjectsInputSchema>;

// Define the output schema using Zod
const AnalyzeImageObjectsOutputSchema = z.object({
  objects: z
    .array(z.string())
    .describe(
      'A list of distinct objects identified in the image. Each item should be a concise name of an object (e.g., "Cat", "Laptop", "Coffee Mug", "Red Apple").'
    ),
});
export type AnalyzeImageObjectsOutput = z.infer<typeof AnalyzeImageObjectsOutputSchema>;


// Define the exported wrapper function
export async function analyzeImageObjects(input: AnalyzeImageObjectsInput): Promise<AnalyzeImageObjectsOutput> {
    console.log('Calling analyzeImageObjectsFlow with input (prefix only):', {
        imageDataUri: input.imageDataUri.substring(0, 50) + '...',
    });
    try {
      const result = await analyzeImageObjectsFlow(input);
      console.log('analyzeImageObjectsFlow successful result:', result);
      return result;
    } catch (error: any) {
       console.error("!!! Critical Error in analyzeImageObjectsFlow !!!");
       console.error("Raw Error Object:", error);

        let errorMessage = "AI analysis failed.";
        if (error instanceof Error) {
            errorMessage += ` Details: ${error.message}`;
             if (error.message.includes('fetch failed')) {
                errorMessage += " (Network/API Key Issue suspected. Verify API Key and network connectivity.)";
             } else if (error.message.includes('NOT_FOUND') || error.message.includes('Model not found')) {
                 errorMessage += " (Model specified might not be available or valid.)";
             } else if (error.message.includes('SAFETY')) {
                 errorMessage += " (Content blocked due to safety settings.)";
             } else if (error.message.includes('API key not valid')) {
                 errorMessage += " (Invalid API Key. Check configuration.)";
             }
        } else {
            errorMessage += ` Unexpected error type: ${String(error)}`;
        }
        console.error("Formatted Error for re-throw:", errorMessage);
        throw new Error(errorMessage);
    }
}

// Define the Genkit prompt
const analyzeImageObjectsPrompt = ai.definePrompt({
  name: 'analyzeImageObjectsPrompt',
  input: {
    schema: AnalyzeImageObjectsInputSchema,
  },
  output: {
    schema: AnalyzeImageObjectsOutputSchema,
  },
  prompt: `You are an expert image analysis AI. Your task is to carefully examine the provided image and identify all distinct, clearly visible objects.
For each object, provide its common name. Be specific where appropriate (e.g., "red toy car" instead of just "car" if color and type are clear).
List only the names of the objects.

Image to analyze:
{{media url=imageDataUri}}
`,
});


// Define the Genkit flow
const analyzeImageObjectsFlow = ai.defineFlow<
  typeof AnalyzeImageObjectsInputSchema,
  typeof AnalyzeImageObjectsOutputSchema
>(
  {
    name: 'analyzeImageObjectsFlow',
    inputSchema: AnalyzeImageObjectsInputSchema,
    outputSchema: AnalyzeImageObjectsOutputSchema,
  },
  async (input) => {
    console.log("Executing analyzeImageObjectsPrompt...");
    // Using the default model specified in ai-instance.ts, ensure it supports vision.
    // Gemini Flash (gemini-1.5-flash-latest or gemini-2.0-flash) is suitable.
    const { output } = await analyzeImageObjectsPrompt(input);

    if (!output) {
      console.error('AI prompt returned null or undefined output for object analysis.');
      return { objects: ["AI analysis returned no result for objects."] };
    }

    try {
      AnalyzeImageObjectsOutputSchema.parse(output);
      console.log("AI object analysis output validated successfully.");
    } catch (validationError) {
      console.error('AI object analysis output validation failed:', validationError);
      return { objects: ["AI output format error for objects."] };
    }

    return output;
  }
);
