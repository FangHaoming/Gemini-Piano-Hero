import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SongInput } from './components/SongInput.tsx';
import { PianoKeyboard } from './components/PianoKeyboard.tsx';
import { GameStatus } from './components/GameStatus.tsx';
import { fetchSongData } from './services/geminiService.ts';
import { KEY_MAP, CODE_TO_KEY_MAP } from './constants.ts';
import type { SongData, GameState } from './types.ts';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [songData, setSongData] = useState<SongData | null>(null);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [correctlyPlayedNotes, setCorrectlyPlayedNotes] = useState<Set<string>>(new Set());
    const [pressedNotes, setPressedNotes] = useState<Record<string, { correct: boolean | null }>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [demoPlayingNotes, setDemoPlayingNotes] = useState<string[]>([]);
    
    const synth = useRef<any>(null);
    const audioInitializationPromise = useRef<Promise<void> | null>(null);
    const activeNotes = useRef(new Set<string>());
    const activeKeyMap = useRef<Record<string, string>>({});
    const animationFrameId = useRef<number | null>(null);

    const noteEvents = useMemo(() => {
        if (!songData) return [];
        const events = new Map<number, string[]>();
        songData.notes.forEach(note => {
            const existingNotes = events.get(note.timing) || [];
            if (!existingNotes.includes(note.note)) {
                 events.set(note.timing, [...existingNotes, note.note]);
            }
        });
        return Array.from(events.entries())
            .sort(([timeA], [timeB]) => timeA - timeB)
            .map(([, notes]) => notes);
    }, [songData]);


    const initializeAudio = useCallback(() => {
        // If synth is already created, we are ready.
        if (synth.current) {
            return Promise.resolve();
        }

        // If initialization is already in progress, return the existing promise.
        if (audioInitializationPromise.current) {
            return audioInitializationPromise.current;
        }

        console.log("Audio context starting, loading samples...");

        // Create a new initialization promise
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                // @ts-ignore
                await Tone.start();
                
                // @ts-ignore
                const sampler = new Tone.Sampler({
                    urls: {
                        'C2': 'C2.mp3',
                        'C3': 'C3.mp3',
                        'C4': 'C4.mp3',
                        'C5': 'C5.mp3',
                        'C6': 'C6.mp3',
                        'C7': 'C7.mp3',
                    },
                    release: 1,
                    baseUrl: "https://tonejs.github.io/audio/salamander/",
                    onload: () => {
                        synth.current = sampler;
                        console.log("Piano samples loaded and audio context ready.");
                        audioInitializationPromise.current = null; // Clear promise on success
                        resolve();
                    },
                    onerror: (error) => {
                        console.error("Error loading piano samples:", error);
                        setErrorMessage("Failed to load piano sounds. Please check your network connection and try again.");
                        setGameState('error');
                        audioInitializationPromise.current = null; // Clear promise on error to allow retry
                        reject(error);
                    }
                }).toDestination();

            } catch (error) {
                console.error("Could not start Tone.js AudioContext:", error);
                setErrorMessage("Could not start audio. Please interact with the page and try again.");
                setGameState('error');
                audioInitializationPromise.current = null; // Clear promise on error to allow retry
                reject(error);
            }
        });
        
        audioInitializationPromise.current = promise;
        return promise;

    }, []);

    const playDemoNote = useCallback((note: string) => {
        if (synth.current) {
            synth.current.triggerAttackRelease(note, "8n");
        }
    }, []);

    const resetStateForNewSong = () => {
        setCurrentEventIndex(0);
        setCorrectlyPlayedNotes(new Set());
        setPressedNotes({});
        setErrorMessage(null);
    };

    const handleSongSubmit = async (prompt: string) => {
        setGameState('loading');
        setSongData(null);
        resetStateForNewSong();

        try {
            await initializeAudio();
            const data = await fetchSongData(prompt);
            setSongData(data);
            setGameState('playing');
        } catch (error) {
            console.error("Failed to start song:", error);
            // Error state is set within initializeAudio or we set it here for fetchSongData
            if (gameState !== 'error') {
                setErrorMessage('Could not generate the song. Please try another one.');
                setGameState('error');
            }
        }
    };
    
    const handleSongImport = async (data: SongData) => {
        setGameState('loading');
        setSongData(null);
        resetStateForNewSong();

        try {
            await initializeAudio();
            setSongData(data);
            setGameState('playing');
        } catch (error) {
            console.error("Failed to import song:", error);
             if (gameState !== 'error') {
                setErrorMessage('Could not load the imported song. Please try again.');
                setGameState('error');
            }
        }
    };

    const handleImportError = (message: string) => {
        setErrorMessage(message);
        setGameState('error');
    };

    const resetGame = () => {
        setGameState('idle');
        setSongData(null);
        resetStateForNewSong();
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

    const playAgain = () => {
        setGameState('playing');
        setCurrentEventIndex(0);
        setCorrectlyPlayedNotes(new Set());
        setPressedNotes({});
    };

    const handleNoteOn = useCallback((playedNote: string) => {
        if (gameState === 'playing') {
            const currentNotes = noteEvents[currentEventIndex] || [];
            const isCorrectAttempt = currentNotes.includes(playedNote);
            const isAlreadyPlayed = correctlyPlayedNotes.has(playedNote);

            setPressedNotes(prev => ({
                ...prev,
                [playedNote]: { correct: isCorrectAttempt }
            }));
            
            if (isCorrectAttempt && !isAlreadyPlayed) {
                const newPlayedNotes = new Set(correctlyPlayedNotes);
                newPlayedNotes.add(playedNote);

                const allNotesInEventPlayed = currentNotes.every(note => newPlayedNotes.has(note));

                if (allNotesInEventPlayed) {
                    const nextIndex = currentEventIndex + 1;
                    if (nextIndex >= noteEvents.length) {
                        setGameState('finished');
                    }
                    // Batch state updates for advancing
                    setCurrentEventIndex(nextIndex);
                    setCorrectlyPlayedNotes(new Set());
                } else {
                    setCorrectlyPlayedNotes(newPlayedNotes);
                }
            }
        } else {
            // Handle free play mode
            setPressedNotes(prev => ({
                ...prev,
                [playedNote]: { correct: null } // Neutral state
            }));
        }
    }, [gameState, noteEvents, currentEventIndex, correctlyPlayedNotes]);

    const handleNoteOff = useCallback((playedNote: string) => {
        if (synth.current && activeNotes.current.has(playedNote)) {
            synth.current.triggerRelease(playedNote);
            activeNotes.current.delete(playedNote);
        }
        setPressedNotes(prev => {
            const newPressedNotes = { ...prev };
            delete newPressedNotes[playedNote];
            return newPressedNotes;
        });
    }, []);

    const handleNoteOnWithSound = useCallback(async (note: string) => {
        if (activeNotes.current.has(note)) return;

        try {
            await initializeAudio();
            // After await, synth.current should be available if successful
            if (synth.current) {
                synth.current.triggerAttack(note);
                activeNotes.current.add(note);
                handleNoteOn(note);
            }
        } catch (error) {
            // Error is already handled and displayed by initializeAudio
            console.log("Skipping note playback due to audio initialization failure.");
        }
    }, [initializeAudio, handleNoteOn]);


    const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement || event.repeat) return;

        const keyChar = CODE_TO_KEY_MAP[event.code];
        if (!keyChar) return;

        let playedNote: string | undefined;
        // First, try to find a mapping for the shifted key (e.g., 'shift+t' for C#4)
        if (event.shiftKey) {
            playedNote = KEY_MAP[`shift+${keyChar}`];
        }

        // If no shifted mapping is found (e.g., for 'shift+f'), or if shift is not pressed,
        // fall back to the base key mapping (e.g., 'f' for E5).
        if (!playedNote) {
            playedNote = KEY_MAP[keyChar];
        }

        if (playedNote) {
            event.preventDefault();
            activeKeyMap.current[event.code] = playedNote;
            handleNoteOnWithSound(playedNote);
        }
    }, [handleNoteOnWithSound]);

     const handleKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement) return;

        const playedNote = activeKeyMap.current[event.code];

        if (playedNote) {
            event.preventDefault();
            delete activeKeyMap.current[event.code];
            handleNoteOff(playedNote);
        }
    }, [handleNoteOff]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        const handleBlur = () => {
            if (synth.current && activeNotes.current.size > 0) {
                synth.current.releaseAll();
                activeNotes.current.clear();
                setPressedNotes({});
                activeKeyMap.current = {};
            }
        };
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
            if (synth.current) {
                synth.current.releaseAll();
            }
        };
    }, [handleKeyDown, handleKeyUp]);

    const notesToHighlight = gameState === 'playing' 
        ? (noteEvents[currentEventIndex] || []).filter(note => !correctlyPlayedNotes.has(note))
        : [];
    
    const upcomingNotes = gameState === 'playing' && noteEvents.length > 0
        ? noteEvents.slice(currentEventIndex + 1, currentEventIndex + 5).flat()
        : [];

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-4 font-sans">
            <header className="text-center my-8">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Piano Hero
                </h1>
                <p className="text-gray-400 mt-2">Enter a song title or describe a melody, and our AI will teach you how to play it!</p>
            </header>
            
            <main className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-8 mb-4">
                {gameState === 'idle' || gameState === 'error' || gameState === 'loading' ? (
                    <SongInput
                        onSubmit={handleSongSubmit}
                        onImport={handleSongImport}
                        onImportError={handleImportError}
                        isLoading={gameState === 'loading'}
                    />
                ) : null}

                <GameStatus
                    state={gameState}
                    songData={songData}
                    currentEventIndex={currentEventIndex}
                    totalEvents={noteEvents.length}
                    errorMessage={errorMessage}
                    onReset={resetGame}
                    onPlayAgain={playAgain}
                    initializeAudio={initializeAudio}
                    playNote={playDemoNote}
                    setDemoPlayingNotes={setDemoPlayingNotes}
                />
            </main>

            <footer className="w-full">
                <PianoKeyboard 
                  notesToHighlight={notesToHighlight}
                  upcomingNotes={upcomingNotes}
                  pressedNotes={pressedNotes}
                  onNoteDown={handleNoteOnWithSound}
                  onNoteUp={handleNoteOff}
                  demoPlayingNotes={demoPlayingNotes}
                />
            </footer>
        </div>
    );
};

export default App;
