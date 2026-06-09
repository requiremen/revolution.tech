const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const systemPrompt = `You are an AI app builder. When the user describes an app, 
you MUST respond with ONLY valid JSON in this exact format:
{
  "html": "<full HTML content>",
  "css": "<full CSS content>",
  "js": "<full JavaScript content>"
}
Do not include any explanation, markdown, or code fences. Output ONLY the JSON.`;

// Streaming (for SSE endpoint)
export async function generateContentStream(prompt) {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: systemPrompt + "\n\nUser request: " + prompt,
    });
    return response;
}

// Non-streaming (for simple use)
export async function generateContent(prompt) {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt + "\n\nUser request: " + prompt,
    });
    return response.text;
}
