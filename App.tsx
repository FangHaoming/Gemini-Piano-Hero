import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SongInput } from './components/SongInput.tsx';
import { PianoKeyboard } from './components/PianoKeyboard.tsx';
import { GameStatus } from './components/GameStatus.tsx';
import { fetchSongData } from './services/geminiService.ts';
import { KEY_MAP, CODE_TO_KEY_MAP } from './constants.ts';
import type { SongData, GameState } from './types.ts';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [songData, setSongData] = useState<SongData | null>(null);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [pressedNotes, setPressedNotes] = useState<Record<string, { correct: boolean }>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [demoPlayingNote, setDemoPlayingNote] = useState<string | null>(null);
    
    const synth = useRef<any>(null);
    const activeNotes = useRef(new Set<string>());
    const activeKeyMap = useRef<Record<string, string>>({});
    // Fix: Initialize useRef with null to provide an initial value. This resolves the error where useRef<number> was called without arguments.
    const animationFrameId = useRef<number | null>(null);

    // Refactored: Create a ref to hold game logic state. This prevents re-creating
    // event handlers on every note press, which was causing intermittent missed key presses.
    const gameLogicState = useRef({ gameState, songData, currentNoteIndex });

    // Keep the ref in sync with the latest state values.
    useEffect(() => {
        gameLogicState.current = { gameState, songData, currentNoteIndex };
    }, [gameState, songData, currentNoteIndex]);


    const initializeAudio = useCallback(async () => {
        if (isAudioReady) return;
        // @ts-ignore
        await Tone.start();
        // @ts-ignore
        synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
        // Fix: Increase polyphony to prevent notes from being dropped during rapid play.
        synth.current.maxPolyphony = 32;
        setIsAudioReady(true);
        console.log("Audio context started.");
    }, [isAudioReady]);

    const playDemoNote = useCallback((note: string) => {
        if (synth.current) {
            synth.current.triggerAttackRelease(note, "8n");
        }
    }, []);

    const handleSongSubmit = async (prompt: string) => {
        await initializeAudio();
        setGameState('loading');
        setSongData(null);
        setCurrentNoteIndex(0);
        setErrorMessage(null);

        try {
            const data = await fetchSongData(prompt);
            setSongData(data);
            setGameState('playing');
        } catch (error) {
            console.error(error);
            setErrorMessage('Could not generate the song. Please try another one.');
            setGameState('error');
        }
    };
    
    const resetGame = () => {
        setGameState('idle');
        setSongData(null);
        setCurrentNoteIndex(0);
        setErrorMessage(null);
        setPressedNotes({});
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

    const playAgain = () => {
        setGameState('playing');
        setCurrentNoteIndex(0);
        setPressedNotes({});
    };

    // Refactored: The event handler now reads from the gameLogicState ref instead of
    // depending on state variables. This makes its function reference stable,
    // so the global event listeners are not constantly removed and re-added.
    const handleNoteOn = useCallback((playedNote: string) => {
        const { gameState, songData } = gameLogicState.current;
        let isCorrect = true;

        if (gameState === 'playing' && songData) {
            const expectedNote = songData.notes[gameLogicState.current.currentNoteIndex];
            if (playedNote === expectedNote.note) {
                isCorrect = true;
                setCurrentNoteIndex(prev => {
                    const currentSongData = gameLogicState.current.songData;
                    if (currentSongData && prev < currentSongData.notes.length && currentSongData.notes[prev].note === playedNote) {
                        const nextIndex = prev + 1;
                        if (nextIndex >= currentSongData.notes.length) {
                            setGameState('finished');
                        }
                        return nextIndex;
                    }
                    return prev;
                });
            } else {
                isCorrect = false;
            }
        }
        setPressedNotes(prev => ({
            ...prev,
            [playedNote]: { correct: isCorrect }
        }));
    }, []); // Empty dependencies make this function stable.

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

        if (!isAudioReady) {
            await initializeAudio();
        }
        
        if (synth.current) {
            synth.current.triggerAttack(note);
            activeNotes.current.add(note);
            handleNoteOn(note);
        }
    }, [isAudioReady, initializeAudio, handleNoteOn]);


    const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement || event.repeat) return;

        const keyChar = CODE_TO_KEY_MAP[event.code];
        if (!keyChar) return;

        const keyId = event.shiftKey ? `shift+${keyChar}` : keyChar;
        const playedNote = KEY_MAP[keyId];

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
    
    // The dependencies for this effect are now much more stable, preventing
    // the listeners from being churned on every note press.
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

    const noteToHighlight = gameState === 'playing' && songData ? songData.notes[currentNoteIndex]?.note : null;
    const upcomingNotes = gameState === 'playing' && songData 
        ? songData.notes.slice(currentNoteIndex + 1, currentNoteIndex + 5).map(n => n.note) 
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
                {/* Fix: Widened the condition to include the 'loading' state. This resolves a TypeScript error where the check `gameState === 'loading'` would always be false due to type narrowing. Now, the SongInput component remains visible but disabled during loading, which is a better user experience. */}
                {gameState === 'idle' || gameState === 'error' || gameState === 'loading' ? (
                    <SongInput onSubmit={handleSongSubmit} isLoading={gameState === 'loading'} />
                ) : null}

                <GameStatus
                    state={gameState}
                    songData={songData}
                    currentNoteIndex={currentNoteIndex}
                    errorMessage={errorMessage}
                    onReset={resetGame}
                    onPlayAgain={playAgain}
                    initializeAudio={initializeAudio}
                    playNote={playDemoNote}
                    setDemoPlayingNote={setDemoPlayingNote}
                />
            </main>

            <footer className="w-full">
                <PianoKeyboard 
                  noteToHighlight={noteToHighlight}
                  upcomingNotes={upcomingNotes}
                  pressedNotes={pressedNotes}
                  onNoteDown={handleNoteOnWithSound}
                  onNoteUp={handleNoteOff}
                  demoPlayingNote={demoPlayingNote}
                />
            </footer>
        </div>
    );
};

export default App;