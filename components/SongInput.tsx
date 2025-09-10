import React, { useState } from 'react';

interface SongInputProps {
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
}

export const SongInput: React.FC<SongInputProps> = ({ onSubmit, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt.trim());
        }
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
            />
            <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
                disabled={isLoading || !prompt.trim()}
            >
                {isLoading ? 'Generating Music...' : 'Get Song'}
            </button>
        </form>
    );
};