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
