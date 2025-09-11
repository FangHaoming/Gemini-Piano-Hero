import React, { useState, useRef } from 'react';
import type { SongData } from '../types.ts';

interface SongInputProps {
    onSubmit: (prompt: string) => void;
    onImport: (songData: SongData) => void;
    onImportError: (message: string) => void;
    isLoading: boolean;
}

export const SongInput: React.FC<SongInputProps> = ({ onSubmit, onImport, onImportError, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt.trim());
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            onImportError('Invalid file type. Please select a .json file.');
            if (e.target) e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                if (!content) {
                    throw new Error("File is empty.");
                }
                const data = JSON.parse(content);
                // Basic validation
                if (typeof data.title !== 'string' || typeof data.bpm !== 'number' || !Array.isArray(data.notes)) {
                   throw new Error("Invalid song file format. Missing required fields.");
                }
                onImport(data as SongData);
            } catch (error) {
                onImportError(error instanceof Error ? error.message : 'Failed to parse JSON file.');
            } finally {
                // Reset file input value to allow re-uploading the same file
                if (e.target) {
                    e.target.value = '';
                }
            }
        };
        reader.onerror = () => {
            onImportError('An error occurred while reading the file.');
        };
        reader.readAsText(file);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center gap-4">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Twinkle Twinkle Little Star' or 'Summer breeze melody'"
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={isLoading}
                aria-label="Song title or melody description"
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/json"
                style={{ display: 'none' }}
                aria-hidden="true"
            />
            <div className="w-full flex flex-col sm:flex-row gap-4">
                <button
                    type="submit"
                    className="flex-grow px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? 'Generating...' : 'Get Song'}
                </button>
                <button
                    type="button"
                    onClick={handleImportClick}
                    className="sm:w-auto px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
                    disabled={isLoading}
                    aria-label="Import song from a JSON file"
                >
                    Import JSON
                </button>
            </div>
        </form>
    );
};