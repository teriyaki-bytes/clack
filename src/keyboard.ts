// deno-lint-ignore-file
import { Keypress } from "./keypress.ts";

/**
 * Get unicode characters sequence
 * @param str
 */
function toUnicode(str: string) {
    let result = '';

    for (let i = 0; i < str.length; i++) {
        let unicode = str.charCodeAt(i).toString(16).toUpperCase();

        while (unicode.length < 4) {
            unicode = '0' + unicode;
        }

        unicode = '\\u' + unicode;
        result += unicode;
    }

    return result;
}

// Regexes used for ansi escape code splitting
const metaKeyCodeRe = /^(?:\x1b)([a-zA-Z0-9])$/;
const functionKeyCodeRe =
    /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;

const charsRe = /^[A-zА-яЁё]$/;

/**
 * Decode control sequence
 * @param message
 */
export function decodeKeypress(message: Uint8Array): Keypress[] {
    let parts;

    const sequence = new TextDecoder().decode(message);
    const event: Keypress = {
        sequence,
        unicode: toUnicode(sequence),
        ctrl: false,
        metaKey: false,
        shift: false,
        backspace: false,
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        escape: false,
        space: false
    };

    if (sequence.length === 1) {
        event.key = sequence;
        event.keyCode = sequence.charCodeAt(0);
    }

    if (sequence === '\r') {
        // carriage return
        event.key = 'return';

    } else if (sequence === '\n') {
        // enter, should have been called linefeed
        event.key = 'enter';

    } else if (sequence === '\t') {
        // tab
        event.key = 'tab';

    } else if (sequence === '\b' || sequence === '\x7f' ||
        sequence === '\x1b\x7f' || sequence === '\x1b\b') {
        // backspace or ctrlKey+h
        event.key = 'backspace';
        event.backspace = true;
        event.metaKey = (sequence.charAt(0) === '\x1b');

    } else if (sequence === '\x1b' || sequence === '\x1b\x1b') {
        // escape key
        event.key = 'escape';
        event.escape = true;
        event.metaKey = (sequence.length === 2);

    } else if (sequence === ' ' || sequence === '\x1b ') {
        event.key = 'space';
        event.space = true;
        event.metaKey = (sequence.length === 2);

    } else if (sequence <= '\x1a') {
        // ctrlKey+letter
        event.key = String.fromCharCode(sequence.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
        event.ctrl = true;

    } else if (sequence.length === 1 && charsRe.test(sequence)) {
        // letter
        event.key = sequence;
        event.shift = sequence !== sequence.toLowerCase() && sequence === sequence.toUpperCase();
    } else if (parts = metaKeyCodeRe.exec(sequence)) {
        // metaKey+character key
        event.key = parts[1].toLowerCase();
        event.metaKey = true;
        event.shift = /^[A-Z]$/.test(parts[1]);

    } else if (parts = functionKeyCodeRe.exec(sequence)) {
        // ansi escape sequence

        // reassemble the key code leaving out leading \x1b's,
        // the modifier key bitflag and any meaningless "1;" sequence
        const code = (parts[1] || '') + (parts[2] || '') +
            (parts[4] || '') + (parts[6] || '');
        const modifier: number = (parts[3] || parts[5] || 1) as number - 1;

        // Parse the key modifier
        event.ctrl = !!(modifier & 4);
        event.metaKey = !!(modifier & 10);
        event.shift = !!(modifier & 1);
        event.code = code;

        // Parse the key itself
        switch (code) {
            /* xterm/gnome ESC O letter */
            case 'OP':
                event.key = 'f1';
                break;
            case 'OQ':
                event.key = 'f2';
                break;
            case 'OR':
                event.key = 'f3';
                break;
            case 'OS':
                event.key = 'f4';
                break;

            /* xterm/rxvt ESC [ number ~ */
            case '[11~':
                event.key = 'f1';
                break;
            case '[12~':
                event.key = 'f2';
                break;
            case '[13~':
                event.key = 'f3';
                break;
            case '[14~':
                event.key = 'f4';
                break;

            /* from Cygwin and used in libuv */
            case '[[A':
                event.key = 'f1';
                break;
            case '[[B':
                event.key = 'f2';
                break;
            case '[[C':
                event.key = 'f3';
                break;
            case '[[D':
                event.key = 'f4';
                break;
            case '[[E':
                event.key = 'f5';
                break;

            /* common */
            case '[15~':
                event.key = 'f5';
                break;
            case '[17~':
                event.key = 'f6';
                break;
            case '[18~':
                event.key = 'f7';
                break;
            case '[19~':
                event.key = 'f8';
                break;
            case '[20~':
                event.key = 'f9';
                break;
            case '[21~':
                event.key = 'f10';
                break;
            case '[23~':
                event.key = 'f11';
                break;
            case '[24~':
                event.key = 'f12';
                break;

            /* xterm ESC [ letter */
            case '[A':
                event.key = 'up';
                event.upArrow = true;
                break;
            case '[B':
                event.key = 'down';
                event.downArrow = true;
                break;
            case '[C':
                event.key = 'right';
                event.rightArrow = true
                break;
            case '[D':
                event.key = 'left';
                break;
            case '[E':
                event.key = 'clear';
                break;
            case '[F':
                event.key = 'end';
                break;
            case '[H':
                event.key = 'home';
                break;

            /* xterm/gnome ESC O letter */
            case 'OA':
                event.key = 'up';
                break;
            case 'OB':
                event.key = 'down';
                break;
            case 'OC':
                event.key = 'right';
                break;
            case 'OD':
                event.key = 'left';
                break;
            case 'OE':
                event.key = 'clear';
                break;
            case 'OF':
                event.key = 'end';
                break;
            case 'OH':
                event.key = 'home';
                break;

            /* xterm/rxvt ESC [ number ~ */
            case '[1~':
                event.key = 'home';
                break;
            case '[2~':
                event.key = 'insert';
                break;
            case '[3~':
                event.key = 'delete';
                break;
            case '[4~':
                event.key = 'end';
                break;
            case '[5~':
                event.key = 'pageup';
                break;
            case '[6~':
                event.key = 'pagedown';
                break;

            /* putty */
            case '[[5~':
                event.key = 'pageup';
                break;
            case '[[6~':
                event.key = 'pagedown';
                break;

            /* rxvt */
            case '[7~':
                event.key = 'home';
                break;
            case '[8~':
                event.key = 'end';
                break;

            /* rxvt keys with modifiers */
            case '[a':
                event.key = 'up';
                event.shift = true;
                break;
            case '[b':
                event.key = 'down';
                event.shift = true;
                break;
            case '[c':
                event.key = 'right';
                event.shift = true;
                break;
            case '[d':
                event.key = 'left';
                event.shift = true;
                break;
            case '[e':
                event.key = 'clear';
                event.shift = true;
                break;

            case '[2$':
                event.key = 'insert';
                event.shift = true;
                break;
            case '[3$':
                event.key = 'delete';
                event.shift = true;
                break;
            case '[5$':
                event.key = 'pageup';
                event.shift = true;
                break;
            case '[6$':
                event.key = 'pagedown';
                event.shift = true;
                break;
            case '[7$':
                event.key = 'home';
                event.shift = true;
                break;
            case '[8$':
                event.key = 'end';
                event.shift = true;
                break;

            case 'Oa':
                event.key = 'up';
                event.ctrl = true;
                break;
            case 'Ob':
                event.key = 'down';
                event.ctrl = true;
                break;
            case 'Oc':
                event.key = 'right';
                event.ctrl = true;
                break;
            case 'Od':
                event.key = 'left';
                event.ctrl = true;
                break;
            case 'Oe':
                event.key = 'clear';
                event.ctrl = true;
                break;

            case '[2^':
                event.key = 'insert';
                event.ctrl = true;
                break;
            case '[3^':
                event.key = 'delete';
                event.ctrl = true;
                break;
            case '[5^':
                event.key = 'pageup';
                event.ctrl = true;
                break;
            case '[6^':
                event.key = 'pagedown';
                event.ctrl = true;
                break;
            case '[7^':
                event.key = 'home';
                event.ctrl = true;
                break;
            case '[8^':
                event.key = 'end';
                event.ctrl = true;
                break;

            /* misc. */
            case '[Z':
                event.key = 'tab';
                event.shift = true;
                break;
            default:
                event.key = 'undefined';
                break;
        }
    } else if (sequence.length > 1 && sequence[0] !== '\x1b') {
        // Got a longer-than-one string of characters.
        // Probably a paste, since it wasn't a control sequence.
        const encoder = new TextEncoder();
        const results: Keypress[][] = sequence.split('')
            .map(character => decodeKeypress(encoder.encode(character)));

        return results.flat();
    }

    return [event];
}
