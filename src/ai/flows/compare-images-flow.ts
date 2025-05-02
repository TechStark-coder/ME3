
'use server';
/**
 * @fileOverview An AI flow to compare two images and identify differences.
 *
 * - compareImages - A function that compares two images and lists differences found in the second image compared to the first.
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

// Define the output schema using Zod - Renamed missingObjects to differences
const CompareImagesOutputSchema = z.object({
  differences: z
    .array(z.string())
    .describe(
      'A list of descriptions detailing the differences observed in the second image compared to the first image. This can include missing objects, altered objects, changes in actions, nature elements, body language, or other notable variations.'
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


// Define the Genkit prompt - Updated instructions for broader difference detection
const compareImagesPrompt = ai.definePrompt({
  name: 'compareImagesPrompt',
  input: {
    schema: CompareImagesInputSchema,
  },
  output: {
    // Updated output schema reference
    schema: CompareImagesOutputSchema,
  },
  // Define the prompt instructions using Handlebars templating - Updated instructions
  prompt: `You are an expert image analysis AI specialized in "spot the difference" tasks.
You will be given two images. Your task is to meticulously compare the second image to the first image (the reference image).
Identify and describe all notable differences between the two images. Focus on:
- Objects: Tangible items present in one image but missing, altered, or replaced in the other.
- Actions/Poses: Changes in what subjects (people, animals) are doing or how they are positioned (body language).
- Nature Elements: Differences in trees, plants, weather, sky, etc.
- Background/Scene details: Changes in surrounding elements, even if subtle.
- Colors/Lighting/Texture: Significant alterations in appearance.

Provide a list of concise descriptions for each distinct difference found in the second image when compared to the first.
Be specific in your descriptions (e.g., "The red car in the background is missing", "The person is now waving instead of pointing", "The large oak tree has fewer leaves").
If no differences are detected, return an empty list.

First Image (Reference):
{{media url=image1DataUri}}

Second Image (Comparison):
{{media url=image2DataUri}}
`,
});


// Define the Genkit flow - Updated to use new output schema
const compareImagesFlow = ai.defineFlow<
  typeof CompareImagesInputSchema,
  typeof CompareImagesOutputSchema // Use updated output schema
>(
  {
    name: 'compareImagesFlow',
    inputSchema: CompareImagesInputSchema,
    outputSchema: CompareImagesOutputSchema, // Use updated output schema
  },
  async (input) => {
    // Call the prompt with the input
    const { output } = await compareImagesPrompt(input);

     // Ensure output is not null or undefined before returning
    if (!output) {
      console.error('AI prompt returned null or undefined output.');
      // Provide a default valid output (empty list for differences)
       return { differences: [] };
    }

     // Validate the output against the schema (Genkit usually does this, but good practice)
    try {
      CompareImagesOutputSchema.parse(output);
    } catch (validationError) {
      console.error('AI output validation failed:', validationError);
       // Handle validation error, e.g., return default
        return { differences: [] }; // Return empty list on validation failure
    }


    return output; // Return the validated output
  }
);
