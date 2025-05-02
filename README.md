
# Spot the Difference AI

This is a Next.js application built with Firebase Studio that uses AI to compare two images and identify the differences.

## Features

- Upload images from your device or capture them using your camera.
- Select two images for comparison.
- AI analyzes the images to find objects present in the first image but missing in the second.
- Results are displayed in a popup, highlighting the missing objects.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

### Prerequisites

- Node.js and npm (or yarn)
- A Google Cloud project with the Generative Language API enabled.
- An API key for the Generative Language API (set as `GOOGLE_GENAI_API_KEY` environment variable).

### Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
2.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add your Google Generative AI API key:
    ```
    GOOGLE_GENAI_API_KEY=YOUR_API_KEY
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will start the Next.js app (usually on `http://localhost:9002`) and the Genkit development server.

4.  Open your browser to `http://localhost:9002`.
