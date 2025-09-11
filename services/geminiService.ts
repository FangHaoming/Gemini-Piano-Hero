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
    const prompt = `You are a creative musical AI. Your task is to generate a piano melody in JSON format based on the user's input. The melody should be playable by a beginner.

User's request: "${userInput}"

**Analysis and Generation Rules:**

1.  **Input Interpretation**:
    - If the user's request is enclosed in double quotes ("" or “”), or book title marks (《》), it is a **specific song title**. Your primary goal is to generate the main melody for that exact song.
    - Otherwise, treat the request as a **descriptive prompt** for a mood or scene and create an original melody.

2.  **Content Generation**:
    - For song titles: Generate a substantial portion of the song's main melody.
    - For descriptive prompts: Create a complete and original melody that fits the description.

3.  **Duration**: The generated melody MUST be at least 60 seconds long. The total duration is determined by the BPM and the total number of beats (the 'timing' of the last note plus its 'duration'). For example, a song at 120 BPM needs at least 120 beats to reach 60 seconds.

4.  **Simplicity & Chords**: The melody must be suitable for a beginner. You can include simple chords (multiple notes played at the same time) to make the music richer. A chord is represented by multiple note objects having the exact same 'timing' value. Do not create complex chords; dyads (two notes) and triads (three notes) are preferred.

5.  **Range**: All notes must be within the 5-octave range of C2 to C7.

6.  **Musicality**: Ensure note timings are sequential and make musical sense.

The output must be a single JSON object. The JSON object should contain the song title, the BPM, and a list of notes. Each note object must have 'note' (e.g., 'C4'), 'duration' (in beats), and 'timing' (start beat).`;

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
