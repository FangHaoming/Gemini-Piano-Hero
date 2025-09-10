import { GoogleGenAI, Type } from "@google/genai";
import type { SongData } from '../types.ts';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the song. If generating from a description, create a fitting title." },
    bpm: { type: Type.NUMBER, description: "The tempo in beats per minute." },
    notes: {
      type: Type.ARRAY,
      description: "An array of notes for the song's melody.",
      items: {
        type: Type.OBJECT,
        properties: {
          note: { type: Type.STRING, description: "The scientific pitch notation of the note (e.g., 'C4', 'F#5')." },
          duration: { type: Type.NUMBER, description: "The duration of the note in beats (e.g., 1 for a quarter note)." },
          timing: { type: Type.NUMBER, description: "The beat on which the note starts, beginning from 0." },
        },
        required: ['note', 'duration', 'timing']
      }
    }
  },
  required: ['title', 'bpm', 'notes']
};

export const fetchSongData = async (userInput: string): Promise<SongData> => {
    const prompt = `You are a creative musical AI. Your task is to generate a simple piano melody in JSON format based on the user's input. The user might provide a specific song title or a descriptive prompt for a mood or scene.

User's request: "${userInput}"

Analyze the request:
- If it seems to be a specific, well-known song title, generate the sheet music for that song's main melody.
- If it's a description (e.g., "a happy, upbeat tune," "a slow, melancholic melody for a rainy day," "music for a lazy beach sunset"), create a short, original melody that fits the description.

The output must be a single JSON object. The JSON object should contain the song title (either the original title or a creative title based on the description), the BPM (beats per minute), and a list of notes. Each note in the list should be an object with three properties: 'note' (the scientific pitch notation, e.g., 'C4'), 'duration' (in beats, where 1 is a quarter note), and 'timing' (the beat on which the note starts, starting from 0). 

Please provide a simplified, single-note melody suitable for a beginner. 

The playable notes are in the 5-octave range C2 to C7. The computer keyboard mapping is as follows:
- White Keys: 1234567890qwertyuiopasdfghjkklzxcvbnm
- Black Keys: Use Shift + the corresponding white key's character (e.g., Shift+1 for C#2, Shift+2 for D#2, etc.).

Please generate a melody that primarily uses these notes. Make sure note timings are sequential and make musical sense.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonString = response.text;
        const parsedData = JSON.parse(jsonString);
        
        // Basic validation
        if (!parsedData.title || !parsedData.bpm || !Array.isArray(parsedData.notes) || parsedData.notes.length === 0) {
            throw new Error("Invalid song data structure received from API.");
        }

        return parsedData as SongData;

    } catch (error) {
        console.error("Error fetching or parsing song data:", error);
        throw new Error("Failed to generate song data from Gemini API.");
    }
};