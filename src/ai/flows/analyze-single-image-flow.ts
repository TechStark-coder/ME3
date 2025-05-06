
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
      'A comprehensive list of distinct objects identified in the image. Each item should be a concise name of an object (e.g., "Cat", "Laptop", "Coffee Mug", "Small red toy car on shelf", "Blue figurine on the right", "Collection of books on the lower shelf", "Individual pencils in a cup"). Be as detailed and exhaustive as possible. List each unique item. If multiple similar items are present but distinct (e.g. different colored toys), list them with their distinguishing features.'
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
  prompt: `You are an exceptionally meticulous and hyper-detailed image analysis AI. Your primary task is to scrutinize the provided image with extreme care and identify **EVERY SINGLE** distinct, clearly visible object, regardless of its size, perceived importance, or location (foreground, background, on shelves, on desks, in hands, etc.). Be exhaustive and list them all.

Pay extraordinarily close attention to:
- **Main subjects:** People, animals, large items.
- **Background elements:** Furniture (chairs, tables, sofas, beds, shelves, cabinets), wall decorations (paintings, posters, mirrors, clocks), scenery (trees, mountains, sky features), buildings (windows, doors, architectural details).
- **Foreground elements:** Items on tables (cups, plates, cutlery, books, laptops, phones), items on floors (rugs, toys, bags), or items held by subjects.
- **Tiny details and collections:** Individual items on shelves (e.g., "small blue toy car on the top shelf", "row of three different ceramic figurines on the middle shelf", "single yellow pencil in a red cup", "collection of assorted colorful buttons in a jar"), items on desks (pens, notepads, staplers, lamps), tools (hammers, screwdrivers), accessories (hats, scarves, jewelry, watches), specific patterns on clothing or objects, textures of surfaces, and even distinct parts of larger objects if they are clearly identifiable as separate entities (e.g., "computer mouse" and "keyboard" separately, not just "computer accessories").
- **Decorative items:** Vases (e.g., "tall glass vase with red flowers"), picture frames (e.g., "silver picture frame with a beach photo"), sculptures, plants (e.g., "small potted succulent on windowsill", "large fern in a corner").
- **Clothing details:** Hats, shoes, specific accessories if clearly identifiable (e.g., "red baseball cap", "black leather belt with a silver buckle").
- **Text and Symbols:** Any readable text or distinct symbols on objects.

For each object identified, provide its common name. Be as specific as possible regarding color, type, material, or any distinguishing features. Examples:
- Instead of "toy", say "small, red, plastic toy car on the wooden shelf".
- Instead of "cup", say "blue ceramic coffee mug with a white handle and a chip on the rim".
- Instead of "books", say "stack of three hardcover books: one red, one blue, one green".
- If there are many small, similar items, try to count them or describe the collection, e.g., "approximately 10-12 small, colorful toy soldiers on the floor", "a dense collection of various seashells in a glass bowl".

**Crucially, for items like toys, figurines, collectibles, or branded products, make every effort to identify specific characters (e.g., 'Spider-Man action figure', 'Pikachu plush toy', 'Iron Man figurine'), brand names if legible (e.g., 'LEGO Millennium Falcon', 'Funko Pop! figure of Darth Vader'), or specific types (e.g., 'wooden toy train', 'Barbie doll in a pink dress', 'yellow Tonka dump truck'). Do not just say 'toy' or 'figurine' if more detail can be extracted. If multiple distinct toy figurines are present, list them with as much unique detail as possible (e.g., 'small blue robot figurine on the top shelf', 'green T-Rex dinosaur toy next to the books', 'collection of various Star Wars minifigures on the desk').**

**Your goal is to be hyper-exhaustive and leave no visible stone unturned.** Do not overlook small, background, or seemingly insignificant items. If you can see it and identify it as a distinct object, list it.
If there are multiple similar items, list them individually if they are clearly distinct or as a group if appropriate but still provide detail (e.g., "three green apples on a plate", "five assorted pens in a desk organizer").

Your response should ONLY be a list of the identified objects. Do not add any conversational fluff or introductory/concluding sentences.

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

