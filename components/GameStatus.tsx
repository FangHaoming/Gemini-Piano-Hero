import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, SongData } from '../types.ts';

interface GameStatusProps {
    state: GameState;
    songData: SongData | null;
    currentEventIndex: number;
    totalEvents: number;
    errorMessage: string | null;
    onReset: () => void;
    onPlayAgain: () => void;
    initializeAudio: () => Promise<void>;
    playNote: (note: string) => void;
    setDemoPlayingNotes: React.Dispatch<React.SetStateAction<string[]>>;
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
    setDemoPlayingNotes: React.Dispatch<React.SetStateAction<string[]>>;
}

const PlaybackButton: React.FC<PlaybackButtonProps> = ({ songData, playNote, initializeAudio, setDemoPlayingNotes }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackTimeouts = useRef<number[]>([]);

    const stopPlayback = useCallback(() => {
        playbackTimeouts.current.forEach(clearTimeout);
        playbackTimeouts.current = [];
        setDemoPlayingNotes([]);
        setIsPlaying(false);
    }, [setDemoPlayingNotes]);

    const handlePlayback = useCallback(async () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }

        await initializeAudio();
        setIsPlaying(true);
        setDemoPlayingNotes([]);

        const beatDurationMs = (60 / songData.bpm) * 1000;
        const timeouts: number[] = [];

        // Group notes by timing to handle chords
        const events = new Map<number, string[]>();
        songData.notes.forEach(note => {
            const existing = events.get(note.timing) || [];
            if (!existing.includes(note.note)) {
                events.set(note.timing, [...existing, note.note]);
            }
        });
        
        const sortedEvents = Array.from(events.entries()).sort(([a], [b]) => a - b);

        let totalDuration = 0;

        sortedEvents.forEach(([timing, notesInEvent]) => {
            const startTimeMs = timing * beatDurationMs;

            const playTimeout = setTimeout(() => {
                notesInEvent.forEach(note => playNote(note));
                setDemoPlayingNotes(notesInEvent);
            }, startTimeMs);
            timeouts.push(playTimeout as unknown as number);
            
            // Find the duration of this event to know when to turn off the highlight
            const notesDataForEvent = songData.notes.filter(n => n.timing === timing);
            const maxDuration = notesDataForEvent.reduce((max, note) => Math.max(max, note.duration), 0);
            const eventDurationMs = maxDuration * beatDurationMs;

            const stopTimeout = setTimeout(() => {
                // Remove only the notes from this event, in case other notes are still playing
                setDemoPlayingNotes(currentNotes => currentNotes.filter(cn => !notesInEvent.includes(cn)));
            }, startTimeMs + (eventDurationMs * 0.95));
            timeouts.push(stopTimeout as unknown as number);

            totalDuration = Math.max(totalDuration, startTimeMs + eventDurationMs);
        });
            
        const finishTimeout = setTimeout(() => {
            setIsPlaying(false);
            setDemoPlayingNotes([]);
            playbackTimeouts.current = [];
        }, totalDuration + 50);
        timeouts.push(finishTimeout as unknown as number);

        playbackTimeouts.current = timeouts;

    }, [songData, playNote, initializeAudio, setDemoPlayingNotes, isPlaying, stopPlayback]);
    
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

export const GameStatus: React.FC<GameStatusProps> = ({ state, songData, currentEventIndex, totalEvents, errorMessage, onReset, onPlayAgain, playNote, initializeAudio, setDemoPlayingNotes }) => {
    
    const handleExport = useCallback((dataToExport: SongData | null) => {
        if (!dataToExport) return;

        const sanitizedTitle = dataToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${sanitizedTitle || 'song'}.json`;
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    switch (state) {
        case 'loading':
            return <LoadingSpinner />;
        case 'playing':
            if (!songData) return null;
            const progress = totalEvents > 0 ? (currentEventIndex / totalEvents) * 100 : 0;
            return (
                <div className="w-full text-center flex flex-col items-center gap-4">
                    <div className="flex justify-between items-center w-full max-w-md">
                      <h2 className="text-2xl font-bold">{songData.title}</h2>
                      <div className="flex items-center gap-2">
                        <PlaybackButton songData={songData} playNote={playNote} initializeAudio={initializeAudio} setDemoPlayingNotes={setDemoPlayingNotes} />
                        <button
                          onClick={() => handleExport(songData)}
                          className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                          aria-label="Export song data as JSON"
                        >
                          Export
                        </button>
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
                    <p className="text-gray-400">{currentEventIndex} / {totalEvents} events played</p>
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
                            onClick={() => handleExport(songData)}
                            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transform hover:scale-105 transition-transform"
                            aria-label="Export song data as JSON"
                        >
                            Export as JSON
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
