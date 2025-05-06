
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
      'A comprehensive list of distinct objects identified in the image. Each item should be a concise name of an object (e.g., "Cat", "Laptop", "Coffee Mug", "Small red toy car on shelf", "Blue figurine on the right"). Be as detailed and exhaustive as possible.'
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
  prompt: `You are an extremely meticulous and detail-oriented image analysis AI. Your primary task is to carefully examine the provided image and identify **EVERY SINGLE** distinct, clearly visible object, no matter how small or seemingly insignificant.

Pay close attention to:
- Main subjects: People, animals, large items.
- Background elements: Furniture, wall decorations, scenery, buildings.
- Foreground elements: Items on tables, floors, or held by subjects.
- **Small details:** Individual items on shelves (like figurines, books, toys), items on desks, tools, accessories, patterns, textures, and even specific parts of larger objects if they are distinct (e.g., "computer mouse" not just "computer accessories").
- Decorative items: Vases, picture frames, sculptures, plants.
- Clothing details: Hats, shoes, specific accessories if clearly identifiable.

For each object identified, provide its common name. Be as specific as possible regarding color, type, or any distinguishing features (e.g., "small red toy car on the top shelf", "blue ceramic coffee mug with a white handle", "silver laptop computer", "collection of colorful figurines on the dark brown shelf").

**Your goal is to be exhaustive.** Do not overlook small or background items. List every object you can confidently identify.
If there are multiple similar items, list them individually if they are distinct or as a group if appropriate (e.g., "three green apples" or "stack of books").

List only the names of the objects in your response.

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

