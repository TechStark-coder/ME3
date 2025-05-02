# Spot the Difference AI

This is a Next.js application built with Firebase Studio that uses AI to compare two images and identify the differences.

## Features

- Upload images from your device or capture them using your camera.
- Select two images for comparison via upload, drag-and-drop, or camera.
- AI analyzes the images to find objects present in the first image but missing in the second, along with other detailed differences.
- Results are displayed in a popup, highlighting the differences.
- Includes UI effects like a gradient background and cursor light effect.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

### Prerequisites

- Node.js and npm (or yarn)
- A Google Cloud project with the **Generative Language API** (also known as Gemini API) enabled. You can enable it here: [https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)
- An API key for the Generative Language API. Create one here: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Set up environment variables:**
    Create a file named `.env.local` in the root directory of the project.
    Add your Google Generative AI API key to this file:
    ```
    # .env.local
    GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE
    ```
    **IMPORTANT:** Replace `YOUR_API_KEY_HERE` with the actual API key you obtained from Google AI Studio or Google Cloud Console. Ensure there are no extra spaces or characters around the key.

3.  **Run the development servers:**
    You need to run two servers concurrently: the Next.js app and the Genkit development server.

    *   **In your first terminal:** Start the Next.js app (includes Turbopack for faster development).
        ```bash
        npm run dev
        # or
        yarn dev
        ```
        This will typically start the app on `http://localhost:9002`.

    *   **In your second terminal:** Start the Genkit development flow server (watches for changes).
        ```bash
        npm run genkit:watch
        # or
        yarn genkit:watch
        ```
        This server handles the communication with the AI model.

4.  **Open your browser** to `http://localhost:9002`.

## Troubleshooting

*   **`Analysis Failed: AI comparison failed. Details: [GoogleGenerativeAI Error]: Error fetching from https://...: fetch failed`**
    *   **Verify API Key:** Double-check that `GOOGLE_GENAI_API_KEY` in your `.env.local` file is correct and doesn't have typos or extra spaces.
    *   **Check API Enabled:** Ensure the "Generative Language API" is enabled in your Google Cloud project linked to the API key.
    *   **Network Issues:** Make sure your computer can connect to `generativelanguage.googleapis.com`. Firewalls, proxies, or VPNs might interfere. Try temporarily disabling them or configuring them correctly.
    *   **Restart Servers:** Stop both the Next.js (`npm run dev`) and Genkit (`npm run genkit:watch`) servers (Ctrl+C) and restart them after checking the key and network.

*   **`Analysis Failed: AI comparison failed. Details: NOT_FOUND: Model '...' not found`**
    *   This usually means the specific Gemini model version being requested isn't available for your project/key or the region. The code currently uses `gemini-2.0-flash`, which is generally available. If this error persists, ensure your Google Cloud project has access to the latest Gemini models.

*   **Camera Issues:**
    *   **Permissions:** Ensure you've granted camera permissions to `http://localhost:9002` in your browser. Browsers often require HTTPS for camera access on deployed sites, but `localhost` is usually an exception.
    *   **Browser Support:** Make sure your browser supports the `navigator.mediaDevices.getUserMedia` API.
    *   **Camera In Use:** Check if another application is using your camera.
    *   **No Camera Found:** Ensure a camera is connected and enabled.

*   **Type Errors (`Cannot find module '@/components/...'`)**
    *   Run `npm install` or `yarn install` again.
    *   Delete `node_modules` and `.next` folders, then run `npm install` or `yarn install`.
    *   Ensure your `tsconfig.json` has `"@/*": ["./src/*"]` under `compilerOptions.paths`.
    *   Restart your code editor and the development servers.
```