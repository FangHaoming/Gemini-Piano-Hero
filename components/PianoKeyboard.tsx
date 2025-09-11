import React from 'react';
import { PIANO_KEYS } from '../constants.ts';

interface PianoKeyboardProps {
    notesToHighlight: string[];
    upcomingNotes: string[];
    pressedNotes: Record<string, { correct: boolean | null }>;
    onNoteDown: (note: string) => void;
    onNoteUp: (note: string) => void;
    demoPlayingNotes: string[];
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ notesToHighlight, upcomingNotes, pressedNotes, onNoteDown, onNoteUp, demoPlayingNotes }) => {
    const whiteKeys = PIANO_KEYS.filter(k => k.type === 'white');
    const WHITE_KEY_WIDTH_PX = 28; // Equivalent to w-7
    const BLACK_KEY_WIDTH_PX = 20; // Equivalent to w-5
    const KEYBOARD_HEIGHT_PX = 192; // Equivalent to h-48
    const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH_PX;

    return (
        <div className="bg-black p-4 rounded-lg shadow-2xl select-none">
            <div 
                className="relative mx-auto" 
                style={{ 
                    width: totalWidth, 
                    height: KEYBOARD_HEIGHT_PX 
                }}
            >
                {/* --- White Keys --- */}
                <div className="absolute top-0 left-0 flex flex-row">
                    {whiteKeys.map((key) => {
                        const { note } = key;
                        const isHighlighted = notesToHighlight.includes(note);
                        const pressInfo = pressedNotes[note];
                        const isPressed = !!pressInfo;
                        // An upcoming note is only shown if it's not currently highlighted or pressed
                        const isUpcoming = upcomingNotes.includes(note) && !isHighlighted && !isPressed;
                        const isDemoNote = demoPlayingNotes.includes(note);
                        
                        let dynamicClasses = 'bg-white hover:bg-gray-200';
                        if (isPressed) {
                            if (pressInfo.correct === true) {
                                dynamicClasses = 'bg-green-300';
                            } else if (pressInfo.correct === false) {
                                dynamicClasses = 'bg-red-300';
                            } else { // Neutral free-play press
                                dynamicClasses = 'bg-gray-400';
                            }
                        } else if (isDemoNote) {
                            dynamicClasses = 'bg-yellow-300';
                        } else if (isHighlighted) {
                            dynamicClasses = 'bg-blue-300';
                        } else if (isUpcoming) {
                            dynamicClasses = 'bg-gray-200';
                        }

                        return (
                            <div
                                key={note}
                                onMouseDown={() => onNoteDown(note)}
                                onMouseUp={() => onNoteUp(note)}
                                onMouseLeave={() => onNoteUp(note)}
                                className={`border-l border-r border-b-2 border-gray-800 rounded-b-lg flex flex-col justify-end items-center pb-2 transition-colors duration-100 cursor-pointer ${dynamicClasses}`}
                                style={{ width: WHITE_KEY_WIDTH_PX, height: KEYBOARD_HEIGHT_PX }}
                            >
                                <span className="font-sans font-bold text-sm text-gray-700">
                                    {key.key.toUpperCase()}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* --- Black Keys --- */}
                {(() => {
                    let whiteKeyCounter = 0;
                    return PIANO_KEYS.map((key) => {
                        if (key.type === 'white') {
                            whiteKeyCounter++;
                            return null;
                        }
                        
                        const { note } = key;
                        const isHighlighted = notesToHighlight.includes(note);
                        const pressInfo = pressedNotes[note];
                        const isPressed = !!pressInfo;
                        const isUpcoming = upcomingNotes.includes(note) && !isHighlighted && !isPressed;
                        const isDemoNote = demoPlayingNotes.includes(note);
                        
                        let dynamicClasses = 'bg-slate-800 hover:bg-slate-700';
                        if (isPressed) {
                            if (pressInfo.correct === true) {
                                dynamicClasses = 'bg-green-500';
                            } else if (pressInfo.correct === false) {
                                dynamicClasses = 'bg-red-500';
                            } else { // Neutral free-play press
                                dynamicClasses = 'bg-slate-600';
                            }
                        } else if (isDemoNote) {
                            dynamicClasses = 'bg-yellow-400';
                        } else if (isHighlighted) {
                            dynamicClasses = 'bg-blue-500';
                        } else if (isUpcoming) {
                            dynamicClasses = 'bg-slate-700';
                        }

                        const leftPosition = whiteKeyCounter * WHITE_KEY_WIDTH_PX - (BLACK_KEY_WIDTH_PX / 2);
                        
                        return (
                            <div
                                key={note}
                                onMouseDown={() => onNoteDown(note)}
                                onMouseUp={() => onNoteUp(note)}
                                onMouseLeave={() => onNoteUp(note)}
                                className={`absolute top-0 rounded-b-lg flex flex-col justify-end items-center pb-2 transition-colors duration-100 cursor-pointer z-10 ${dynamicClasses}`}
                                style={{
                                    left: leftPosition,
                                    width: BLACK_KEY_WIDTH_PX,
                                    height: KEYBOARD_HEIGHT_PX * 0.6,
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3)',
                                }}
                            >
                                <div className="font-sans font-bold text-white text-xs flex flex-col items-center leading-none">
                                    <span className="text-sm">↑</span>
                                    <span>{key.key.toUpperCase()}</span>
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
};
