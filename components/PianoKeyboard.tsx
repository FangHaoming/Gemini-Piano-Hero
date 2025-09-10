import React from 'react';
import { PIANO_KEYS } from '../constants.ts';

interface PianoKeyboardProps {
    noteToHighlight: string | null;
    upcomingNotes: string[];
    pressedNotes: Record<string, { correct: boolean }>;
    onNoteDown: (note: string) => void;
    onNoteUp: (note: string) => void;
    demoPlayingNote: string | null;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ noteToHighlight, upcomingNotes, pressedNotes, onNoteDown, onNoteUp, demoPlayingNote }) => {
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
                        const isHighlighted = note === noteToHighlight;
                        const isUpcoming = upcomingNotes.includes(note);
                        const pressInfo = pressedNotes[note];
                        const isPressed = !!pressInfo;
                        const isDemoNote = note === demoPlayingNote;
                        
                        let dynamicClasses = 'bg-white hover:bg-gray-200';
                        if (isPressed) {
                            dynamicClasses = pressInfo.correct ? 'bg-green-300' : 'bg-red-300';
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
                        const isHighlighted = note === noteToHighlight;
                        const isUpcoming = upcomingNotes.includes(note);
                        const pressInfo = pressedNotes[note];
                        const isPressed = !!pressInfo;
                        const isDemoNote = note === demoPlayingNote;
                        
                        // Use slate for a more bluish-grey, remove borders for a flatter look
                        let dynamicClasses = 'bg-slate-800 hover:bg-slate-700';
                        if (isPressed) {
                            dynamicClasses = pressInfo.correct ? 'bg-green-500' : 'bg-red-500';
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
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3)', // Add subtle shadow for depth
                                }}
                            >
                                {/* Vertically stacked shift icon and key character */}
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