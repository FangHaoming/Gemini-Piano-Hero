import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, SongData } from '../types.ts';

interface GameStatusProps {
    state: GameState;
    songData: SongData | null;
    currentNoteIndex: number;
    errorMessage: string | null;
    onReset: () => void;
    onPlayAgain: () => void;
    initializeAudio: () => Promise<void>;
    playNote: (note: string) => void;
    // Fix: Corrected the type of `setDemoPlayingNote` to `React.Dispatch<React.SetStateAction<string | null>>`. This allows passing a state updater function, which resolves a TypeScript error in the playback logic where such a function is used.
    setDemoPlayingNote: React.Dispatch<React.SetStateAction<string | null>>;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center gap-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400"></div>
        <p className="text-lg text-gray-300">Generating your personal piano lesson...</p>
    </div>
);

interface PlaybackButtonProps {
    songData: SongData;
    playNote: (note: string) => void;
    initializeAudio: () => Promise<void>;
    // Fix: Corrected the type of `setDemoPlayingNote` to `React.Dispatch<React.SetStateAction<string | null>>`. This aligns with the parent component's state setter and fixes a type error.
    setDemoPlayingNote: React.Dispatch<React.SetStateAction<string | null>>;
}

const PlaybackButton: React.FC<PlaybackButtonProps> = ({ songData, playNote, initializeAudio, setDemoPlayingNote }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackTimeouts = useRef<number[]>([]);

    const stopPlayback = useCallback(() => {
        playbackTimeouts.current.forEach(clearTimeout);
        playbackTimeouts.current = [];
        setDemoPlayingNote(null);
        setIsPlaying(false);
    }, [setDemoPlayingNote]);

    const handlePlayback = useCallback(async () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }

        await initializeAudio();
        setIsPlaying(true);
        setDemoPlayingNote(null);

        const beatDurationMs = (60 / songData.bpm) * 1000;
        const timeouts: number[] = [];

        songData.notes.forEach(note => {
            const startTimeMs = note.timing * beatDurationMs;
            const noteDurationMs = note.duration * beatDurationMs;

            const playTimeout = setTimeout(() => {
                playNote(note.note);
                setDemoPlayingNote(note.note);
            }, startTimeMs);
            timeouts.push(playTimeout as unknown as number);

            const stopTimeout = setTimeout(() => {
                setDemoPlayingNote(currentNote => (currentNote === note.note ? null : currentNote));
            }, startTimeMs + (noteDurationMs * 0.95));
            timeouts.push(stopTimeout as unknown as number);
        });

        const totalDuration = songData.notes.length > 0
            ? (songData.notes[songData.notes.length - 1].timing + songData.notes[songData.notes.length - 1].duration) * beatDurationMs
            : 0;
            
        const finishTimeout = setTimeout(() => {
            setIsPlaying(false);
            setDemoPlayingNote(null);
            playbackTimeouts.current = [];
        }, totalDuration + 50);
        timeouts.push(finishTimeout as unknown as number);

        playbackTimeouts.current = timeouts;

    }, [songData, playNote, initializeAudio, setDemoPlayingNote, isPlaying, stopPlayback]);
    
    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, [stopPlayback]);

    return (
      <button onClick={handlePlayback} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 w-28">
        {isPlaying ? 'Stop Demo' : 'Hear Demo'}
      </button>
    )
}

export const GameStatus: React.FC<GameStatusProps> = ({ state, songData, currentNoteIndex, errorMessage, onReset, onPlayAgain, playNote, initializeAudio, setDemoPlayingNote }) => {
    switch (state) {
        case 'loading':
            return <LoadingSpinner />;
        case 'playing':
            if (!songData) return null;
            const progress = (currentNoteIndex / songData.notes.length) * 100;
            return (
                <div className="w-full text-center flex flex-col items-center gap-4">
                    <div className="flex justify-between items-center w-full max-w-md">
                      <h2 className="text-2xl font-bold">{songData.title}</h2>
                      <div className="flex items-center gap-2">
                        <PlaybackButton songData={songData} playNote={playNote} initializeAudio={initializeAudio} setDemoPlayingNote={setDemoPlayingNote} />
                        <button 
                          onClick={onReset} 
                          className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                          aria-label="Go back to song selection"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="w-full max-w-md bg-gray-700 rounded-full h-4">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-gray-400">{currentNoteIndex} / {songData.notes.length} notes played</p>
                </div>
            );
        case 'finished':
            return (
                <div className="text-center flex flex-col items-center gap-4 py-12 px-8">
                    <h2 className="text-4xl font-bold text-green-400">Congratulations!</h2>
                    <p className="text-lg text-gray-200">You played "{songData?.title}" perfectly!</p>
                    <div className="flex items-center gap-4 mt-6">
                        <button
                            onClick={onPlayAgain}
                            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transform hover:scale-105 transition-transform"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={onReset}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-transform"
                        >
                            Play Another Song
                        </button>
                    </div>
                </div>
            );
        case 'error':
            return (
                <div className="text-center text-red-400 flex flex-col items-center gap-4">
                    <h2 className="text-2xl font-bold">Oh no!</h2>
                    <p>{errorMessage}</p>
                    <button onClick={onReset} className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
                        Try Again
                    </button>
                </div>
            );
        default:
            return null;
    }
};