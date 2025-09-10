// 61-key, 5-octave layout from C2 to C7
export const KEY_MAP: Record<string, string> = {
    // --- White Keys ---
    // Octave 2
    '1': 'C2', '2': 'D2', '3': 'E2', '4': 'F2', '5': 'G2', '6': 'A2', '7': 'B2',
    // Octave 3
    '8': 'C3', '9': 'D3', '0': 'E3', 'q': 'F3', 'w': 'G3', 'e': 'A3', 'r': 'B3',
    // Octave 4
    't': 'C4', 'y': 'D4', 'u': 'E4', 'i': 'F4', 'o': 'G4', 'p': 'A4', 'a': 'B4',
    // Octave 5
    's': 'C5', 'd': 'D5', 'f': 'E5', 'g': 'F5', 'h': 'G5', 'j': 'A5', 'k': 'B5',
    // Octave 6
    'l': 'C6', 'z': 'D6', 'x': 'E6', 'c': 'F6', 'v': 'G6', 'b': 'A6', 'n': 'B6',
    // Octave 7
    'm': 'C7',

    // --- Black Keys (Shift) ---
    // Octave 2
    'shift+1': 'C#2', 'shift+2': 'D#2', 'shift+4': 'F#2', 'shift+5': 'G#2', 'shift+6': 'A#2',
    // Octave 3
    'shift+8': 'C#3', 'shift+9': 'D#3', 'shift+q': 'F#3', 'shift+w': 'G#3', 'shift+e': 'A#3',
    // Octave 4
    'shift+t': 'C#4', 'shift+y': 'D#4', 'shift+i': 'F#4', 'shift+o': 'G#4', 'shift+p': 'A#4',
    // Octave 5
    'shift+s': 'C#5', 'shift+d': 'D#5', 'shift+g': 'F#5', 'shift+h': 'G#5', 'shift+j': 'A#5',
    // Octave 6
    'shift+l': 'C#6', 'shift+z': 'D#6', 'shift+c': 'F#6', 'shift+v': 'G#6', 'shift+b': 'A#6',
};

// Visual layout for the 61-key piano
export const PIANO_KEYS = [
    { note: 'C2', type: 'white', key: '1' }, { note: 'C#2', type: 'black', key: '1', shift: true },
    { note: 'D2', type: 'white', key: '2' }, { note: 'D#2', type: 'black', key: '2', shift: true },
    { note: 'E2', type: 'white', key: '3' },
    { note: 'F2', type: 'white', key: '4' }, { note: 'F#2', type: 'black', key: '4', shift: true },
    { note: 'G2', type: 'white', key: '5' }, { note: 'G#2', type: 'black', key: '5', shift: true },
    { note: 'A2', type: 'white', key: '6' }, { note: 'A#2', type: 'black', key: '6', shift: true },
    { note: 'B2', type: 'white', key: '7' },
    { note: 'C3', type: 'white', key: '8' }, { note: 'C#3', type: 'black', key: '8', shift: true },
    { note: 'D3', type: 'white', key: '9' }, { note: 'D#3', type: 'black', key: '9', shift: true },
    { note: 'E3', type: 'white', key: '0' },
    { note: 'F3', type: 'white', key: 'q' }, { note: 'F#3', type: 'black', key: 'q', shift: true },
    { note: 'G3', type: 'white', key: 'w' }, { note: 'G#3', type: 'black', key: 'w', shift: true },
    { note: 'A3', type: 'white', key: 'e' }, { note: 'A#3', type: 'black', key: 'e', shift: true },
    { note: 'B3', type: 'white', key: 'r' },
    { note: 'C4', type: 'white', key: 't' }, { note: 'C#4', type: 'black', key: 't', shift: true },
    { note: 'D4', type: 'white', key: 'y' }, { note: 'D#4', type: 'black', key: 'y', shift: true },
    { note: 'E4', type: 'white', key: 'u' },
    { note: 'F4', type: 'white', key: 'i' }, { note: 'F#4', type: 'black', key: 'i', shift: true },
    { note: 'G4', type: 'white', key: 'o' }, { note: 'G#4', type: 'black', key: 'o', shift: true },
    { note: 'A4', type: 'white', key: 'p' }, { note: 'A#4', type: 'black', key: 'p', shift: true },
    { note: 'B4', type: 'white', key: 'a' },
    { note: 'C5', type: 'white', key: 's' }, { note: 'C#5', type: 'black', key: 's', shift: true },
    { note: 'D5', type: 'white', key: 'd' }, { note: 'D#5', type: 'black', key: 'd', shift: true },
    { note: 'E5', type: 'white', key: 'f' },
    { note: 'F5', type: 'white', key: 'g' }, { note: 'F#5', type: 'black', key: 'g', shift: true },
    { note: 'G5', type: 'white', key: 'h' }, { note: 'G#5', type: 'black', key: 'h', shift: true },
    { note: 'A5', type: 'white', key: 'j' }, { note: 'A#5', type: 'black', key: 'j', shift: true },
    { note: 'B5', type: 'white', key: 'k' },
    { note: 'C6', type: 'white', key: 'l' }, { note: 'C#6', type: 'black', key: 'l', shift: true },
    { note: 'D6', type: 'white', key: 'z' }, { note: 'D#6', type: 'black', key: 'z', shift: true },
    { note: 'E6', type: 'white', key: 'x' },
    { note: 'F6', type: 'white', key: 'c' }, { note: 'F#6', type: 'black', key: 'c', shift: true },
    { note: 'G6', type: 'white', key: 'v' }, { note: 'G#6', type: 'black', key: 'v', shift: true },
    { note: 'A6', type: 'white', key: 'b' }, { note: 'A#6', type: 'black', key: 'b', shift: true },
    { note: 'B6', type: 'white', key: 'n' },
    { note: 'C7', type: 'white', key: 'm' },
];

export const CODE_TO_KEY_MAP: Record<string, string> = {
    // Top row numbers
    'Digit1': '1',
    'Digit2': '2',
    'Digit3': '3',
    'Digit4': '4',
    'Digit5': '5',
    'Digit6': '6',
    'Digit7': '7',
    'Digit8': '8',
    'Digit9': '9',
    'Digit0': '0',
    // Top row letters
    'KeyQ': 'q',
    'KeyW': 'w',
    'KeyE': 'e',
    'KeyR': 'r',
    'KeyT': 't',
    'KeyY': 'y',
    'KeyU': 'u',
    'KeyI': 'i',
    'KeyO': 'o',
    'KeyP': 'p',
    // Home row letters
    'KeyA': 'a',
    'KeyS': 's',
    'KeyD': 'd',
    'KeyF': 'f',
    'KeyG': 'g',
    'KeyH': 'h',
    'KeyJ': 'j',
    'KeyK': 'k',
    'KeyL': 'l',
    // Bottom row letters
    'KeyZ': 'z',
    'KeyX': 'x',
    'KeyC': 'c',
    'KeyV': 'v',
    'KeyB': 'b',
    'KeyN': 'n',
    'KeyM': 'm',
};