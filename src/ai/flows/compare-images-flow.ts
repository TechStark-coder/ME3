
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

// Define the output schema using Zod
const CompareImagesOutputSchema = z.object({
  differences: z
    .array(z.string())
    .describe(
      'A list of concise descriptions detailing every distinct difference observed in the second image compared to the first image. This includes missing/added/altered objects, changes in actions, poses, expressions, nature elements, background details, text, patterns, lighting, shadows, colors, textures, and any other notable variations.'
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
      // Use a potentially more capable/slower model if needed, but start with prompt enhancement
      // Example: const result = await compareImagesFlow(input, { model: 'googleai/gemini-pro' });
      const result = await compareImagesFlow(input);
      console.log('compareImagesFlow result:', result);
      return result;
    } catch (error) {
      console.error("Error in compareImagesFlow:", error);
      // Re-throw the error or handle it as needed
       throw new Error(`AI comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// Define the Genkit prompt - Significantly Enhanced Instructions
const compareImagesPrompt = ai.definePrompt({
  name: 'compareImagesPrompt',
  input: {
    schema: CompareImagesInputSchema,
  },
  output: {
    schema: CompareImagesOutputSchema,
  },
  // Define the prompt instructions using Handlebars templating - Enhanced Instructions
  prompt: `You are an extremely meticulous and detail-oriented image analysis AI, specialized in "spot the difference" tasks. Your accuracy is paramount. Take your time to be thorough.

You will be given two images: Image 1 (Reference) and Image 2 (Comparison).
Your task is to perform an exhaustive pixel-by-pixel level comparison of Image 2 against Image 1.
Identify and describe **ALL** distinct differences, no matter how subtle. Be incredibly precise.

Carefully examine and report differences in the following categories:

1.  **Objects:**
    *   Missing objects: Items present in Image 1 but absent in Image 2. (e.g., "The blue coffee mug on the table is missing.")
    *   Added objects: Items absent in Image 1 but present in Image 2. (e.g., "A small potted plant has been added to the windowsill.")
    *   Altered objects: Items present in both but changed in appearance, position, rotation, or state (e.g., "The clock's hands show a different time.", "The book on the shelf is now open instead of closed.", "The cat's position has slightly shifted to the left.")

2.  **Subjects (People/Animals):**
    *   Actions/Poses: Changes in what they are doing. (e.g., "The person is now smiling instead of frowning.", "The dog is now sitting instead of standing.")
    *   Body Language/Expressions: Subtle shifts in posture or facial expression. (e.g., "The woman's left eyebrow is slightly raised.", "The man's arms are now crossed.")
    *   Clothing/Appearance: Changes in attire, accessories, or features. (e.g., "The child's shirt color changed from red to green.", "The bird has an extra feather on its wing.")

3.  **Environment/Background:**
    *   Nature Elements: Differences in trees (leaf density, branches), plants (flowers bloomed/wilted), weather (clouds moved, sun position changed leading to different shadows), water bodies (ripples, level). (e.g., "The large oak tree has fewer leaves.", "A cloud shape in the top right corner is different.")
    *   Scene Details: Changes in furniture arrangement, wall decorations, items on shelves, background buildings, vehicles. (e.g., "The painting on the back wall is slightly crooked.", "A car in the distant background is a different color.")
    *   Text/Signs: Any alterations in letters, numbers, or symbols. (e.g., "The street sign now reads 'ELM ST' instead of 'OAK ST'.")
    *   Patterns/Textures: Changes in patterns on fabrics, walls, floors, or textures of surfaces. (e.g., "The pattern on the curtain has an extra stripe.", "The texture of the wooden table appears smoother.")

4.  **Visual Properties:**
    *   Colors: Noticeable shifts in hue, saturation, or brightness of any element. (e.g., "The color of the balloon is now orange instead of yellow.")
    *   Lighting/Shadows: Changes in the direction, intensity, or shape of light and shadows. (e.g., "The shadow cast by the chair is longer.", "There is a new light reflection on the window pane.")

**Output Format:**
Provide a list of concise, specific descriptions for each distinct difference found. Start each description clearly identifying the element and the change. Be precise (e.g., "The *small green* car...", "The person's *right* hand...").

**Accuracy Check:**
Before finalizing your list, review both images one last time to ensure your identified differences are accurate and that you haven't missed anything. Be extremely critical of your own analysis. If no differences are detected after careful scrutiny, return an empty list.

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
    // Consider adding model configuration here if needed for accuracy:
    // const { output } = await compareImagesPrompt(input, { model: 'googleai/gemini-pro' });
    const { output } = await compareImagesPrompt(input);

     // Ensure output is not null or undefined before returning
    if (!output) {
      console.error('AI prompt returned null or undefined output.');
      // Provide a default valid output (empty list for differences)
       return { differences: ["AI analysis returned no result."] }; // Indicate analysis issue
    }

     // Validate the output against the schema (Genkit usually does this, but good practice)
    try {
      CompareImagesOutputSchema.parse(output);
    } catch (validationError) {
      console.error('AI output validation failed:', validationError);
       // Handle validation error, e.g., return default
        return { differences: ["AI output format error."] }; // Indicate format issue
    }

    return output; // Return the validated output
  }
);
