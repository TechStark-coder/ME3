
'use server';
/**
 * @fileOverview An AI flow to compare two images and identify differences.
 *
 * - compareImages - A function that compares two images and lists objects missing from the second image.
 * - CompareImagesInput - The input type for the compareImages function.
 * - CompareImagesOutput - The return type for the compareImages function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the input schema using Zod
const CompareImagesInputSchema = z.object({
  image1DataUri: z
    .string()
    .describe(
      "The first image (reference image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  image2DataUri: z
    .string()
    .describe(
      "The second image (comparison image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CompareImagesInput = z.infer<typeof CompareImagesInputSchema>;

// Define the output schema using Zod
const CompareImagesOutputSchema = z.object({
  missingObjects: z
    .array(z.string())
    .describe(
      'A list of names of distinct objects present in the first image but missing in the second image.'
    ),
});
export type CompareImagesOutput = z.infer<typeof CompareImagesOutputSchema>;


// Define the exported wrapper function
export async function compareImages(input: CompareImagesInput): Promise<CompareImagesOutput> {
    console.log('Calling compareImagesFlow with input:', {
        image1DataUri: input.image1DataUri.substring(0, 50) + '...', // Log only prefix
        image2DataUri: input.image2DataUri.substring(0, 50) + '...', // Log only prefix
    });
    try {
      const result = await compareImagesFlow(input);
      console.log('compareImagesFlow result:', result);
      return result;
    } catch (error) {
      console.error("Error in compareImagesFlow:", error);
      // Re-throw the error or handle it as needed
       throw new Error(`AI comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// Define the Genkit prompt
const compareImagesPrompt = ai.definePrompt({
  name: 'compareImagesPrompt',
  input: {
    schema: CompareImagesInputSchema,
  },
  output: {
    schema: CompareImagesOutputSchema,
  },
  // Define the prompt instructions using Handlebars templating
  prompt: `You are an expert image analysis AI specialized in "spot the difference" tasks.
You will be given two images. Your task is to carefully compare the second image to the first image (the reference image).
Identify distinct, tangible objects that are clearly visible in the first image but are completely missing or significantly altered/replaced in the second image.
Ignore minor differences in position, lighting, angle, or texture unless they constitute a different object entirely.
Focus on the presence or absence of objects.

List the names of the objects that are present in the first image but missing from the second image.
If no objects are missing, return an empty list.

First Image (Reference):
{{media url=image1DataUri}}

Second Image (Comparison):
{{media url=image2DataUri}}
`,
});


// Define the Genkit flow
const compareImagesFlow = ai.defineFlow<
  typeof CompareImagesInputSchema,
  typeof CompareImagesOutputSchema
>(
  {
    name: 'compareImagesFlow',
    inputSchema: CompareImagesInputSchema,
    outputSchema: CompareImagesOutputSchema,
  },
  async (input) => {
    // Call the prompt with the input
    const { output } = await compareImagesPrompt(input);

     // Ensure output is not null or undefined before returning
    if (!output) {
      console.error('AI prompt returned null or undefined output.');
      // Provide a default valid output or throw an error
      // Option 1: Return a default (e.g., empty list)
       return { missingObjects: [] };
      // Option 2: Throw an error
      // throw new Error('AI prompt failed to return a valid output.');
    }

     // Validate the output against the schema (Genkit usually does this, but good practice)
    try {
      CompareImagesOutputSchema.parse(output);
    } catch (validationError) {
      console.error('AI output validation failed:', validationError);
       // Handle validation error, e.g., return default or throw
       // Option 1: Return default
        return { missingObjects: [] }; // Or a more specific error indicator if needed
       // Option 2: Throw specific error
      // throw new Error(`AI output validation failed: ${validationError.message}`);
    }


    return output;
  }
);
