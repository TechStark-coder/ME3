
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
      'A list of concise descriptions detailing every distinct difference observed in the second image compared to the first image. This includes missing/added/altered objects (even partially visible or distant ones), changes in actions, poses, expressions, nature elements, background details, text, patterns, lighting, shadows, colors, textures, and any other notable variations.'
    ),
});
export type CompareImagesOutput = z.infer<typeof CompareImagesOutputSchema>;


// Define the exported wrapper function
export async function compareImages(input: CompareImagesInput): Promise<CompareImagesOutput> {
    console.log('Calling compareImagesFlow with input (prefixes only):', {
        image1DataUri: input.image1DataUri.substring(0, 50) + '...', // Log only prefix
        image2DataUri: input.image2DataUri.substring(0, 50) + '...', // Log only prefix
    });
    try {
      const result = await compareImagesFlow(input);
      console.log('compareImagesFlow successful result:', result);
      return result;
    } catch (error: any) {
       console.error("!!! Critical Error in compareImagesFlow !!!");
       console.error("Raw Error Object:", error); // Log the raw error object

        let errorMessage = "AI comparison failed.";

        // Check for specific error types or messages
        if (error instanceof Error) {
            errorMessage += ` Details: ${error.message}`;
             // Check for fetch failure specifically
             if (error.message.includes('fetch failed')) {
                errorMessage += " (Network/API Key Issue suspected. Verify API Key and network connectivity to Google APIs.)";
                console.error("FETCH FAILED - Check GOOGLE_GENAI_API_KEY validity and network access to generativelanguage.googleapis.com.");
             }
             // Check for model not found errors
             else if (error.message.includes('NOT_FOUND') || error.message.includes('Model not found')) {
                 errorMessage += " (Model specified might not be available or valid for your API key/project.)";
                 console.error("MODEL NOT FOUND - Ensure the model name in ai-instance.ts and the flow is correct and enabled for your project/key.");
             }
             // Check for safety settings issues
             else if (error.message.includes('SAFETY')) {
                 errorMessage += " (Content blocked due to safety settings.)";
                 console.error("SAFETY BLOCK - The prompt or image content triggered safety filters.");
             }
              // Check for API key validity issues
             else if (error.message.includes('API key not valid')) {
                 errorMessage += " (Invalid API Key. Please check your GOOGLE_GENAI_API_KEY environment variable.)";
                  console.error("INVALID API KEY - Verify the GOOGLE_GENAI_API_KEY in your .env.local file.");
             }
        } else {
            errorMessage += ` Unexpected error type: ${String(error)}`;
        }

        // Log the final formatted error message before throwing
        console.error("Formatted Error for re-throw:", errorMessage);
      // Re-throw the enhanced error message
       throw new Error(errorMessage);
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
  prompt: `You are an exceptionally meticulous, hyper-detailed, and eagle-eyed image analysis AI. Your specialization is "spot the difference" tasks, and your accuracy is paramount. You must be incredibly thorough, scrutinizing every detail with extreme care.

You will be given two images: Image 1 (Reference) and Image 2 (Comparison).
Your task is to perform an exhaustive, pixel-by-pixel level comparison of Image 2 against Image 1.
Identify and describe **ALL** distinct differences, no matter how subtle, small, distant, or partially obscured they may be.

**Crucial Instructions for Accuracy:**

1.  **Object Analysis (Hyper-Detailed):**
    *   **Missing Objects:** Identify items present in Image 1 but COMPLETELY ABSENT in Image 2. This includes objects that were fully visible, partially visible (e.g., "the top of a yellow toy car visible on the far shelf is missing"), or even implied by context in Image 1 and clearly gone in Image 2. For instance, if a yellow toy is partially visible behind a book in Image 1, and in Image 2 the book is still there but the space where the toy was is now empty, you must report "The partially visible yellow toy behind the book is missing."
    *   **Added Objects:** Identify items COMPLETELY ABSENT in Image 1 but present in Image 2. (e.g., "A new blue ball has been placed on the floor.")
    *   **Altered Objects:** Items present in both images but changed in ANY way:
        *   **Position/Rotation/Orientation:** (e.g., "The red book on the desk has been rotated 90 degrees clockwise.", "The teddy bear is now facing left instead of right.")
        *   **State:** (e.g., "The laptop is now open instead of closed.", "The flower in the vase has wilted slightly.")
        *   **Appearance:** Color changes, texture changes, damage, additions/subtractions of parts. (e.g., "The cat's fur appears slightly darker.", "The toy soldier is now missing an arm.")

2.  **Partial Visibility and Occlusion:** Pay extreme attention to objects that are partially visible or occluded. If an object is visible in Image 1 (even a small part of it, like a corner of a box, a sliver of a toy, or a distant item) and that same part or the inferred whole object is missing or changed in Image 2, this is a critical difference. For example, if only the tail of a toy dinosaur is visible in Image 1 from behind a plant, and that tail is gone in Image 2 (even if the plant is still there), list "The toy dinosaur's tail (previously visible behind the plant) is missing."

3.  **Distant and Background Elements:** Do not overlook items in the far background or periphery. Changes to distant trees, buildings, clouds, or even minute details on a faraway shelf are important.

4.  **Subjects (People/Animals):**
    *   **Actions/Poses:** (e.g., "The person is now winking with their left eye.", "The dog's tail is now wagging instead of still.")
    *   **Body Language/Expressions:** (e.g., "The woman's smile is slightly wider.", "The man's shoulders are now slumped.")
    *   **Clothing/Appearance:** (e.g., "The child's shoelaces are now untied.", "The bird has a small twig in its beak.")

5.  **Environment/Background:**
    *   **Nature Elements:** (e.g., "A leaf has fallen from the small plant on the windowsill.", "The puddle on the ground is smaller.")
    *   **Scene Details:** (e.g., "A pen is missing from the desk organizer.", "The picture frame on the wall is tilted slightly more to the right.")
    *   **Text/Signs:** (e.g., "The price tag on the item now shows '$9.99' instead of '$10.99'.")
    *   **Patterns/Textures:** (e.g., "The wood grain pattern on the table is oriented differently.", "A small scratch is now visible on the shiny surface.")

6.  **Visual Properties:**
    *   **Colors:** (e.g., "The blue of the sky is a slightly deeper shade.")
    *   **Lighting/Shadows:** (e.g., "The shadow of the lamp is now cast at a different angle, indicating a time change.", "A new reflection is visible on the glass surface.")

**Output Format:**
Provide a list of concise, specific, and unambiguous descriptions for each distinct difference found. Be extremely precise (e.g., "The *small, yellow, partially visible* toy car on the *top far-left* shelf is missing.", "The person's *right index finger* is now pointing upwards instead of being curled.").

**Final Accuracy Check:**
Before finalizing your list, meticulously review both images one last time, specifically hunting for the types of subtle differences described above. Be your own harshest critic. If, after this exhaustive scrutiny, no differences are detected, and only then, return an empty list.

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
    console.log("Executing compareImagesPrompt with default model (gemini-2.0-flash)...");
    // Default model is defined in ai-instance.ts, which is gemini-2.0-flash
    // Ensure the model used supports vision capabilities. Gemini Flash does.
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
      console.log("AI output validated successfully against schema.");
    } catch (validationError) {
      console.error('AI output validation failed:', validationError);
       // Handle validation error, e.g., return default
        return { differences: ["AI output format error."] }; // Indicate format issue
    }

    return output; // Return the validated output
  }
);


    