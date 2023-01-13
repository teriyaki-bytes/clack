import { decodeKeypress } from "./src/keyboard.ts";
import { Keypress } from "./src/keypress.ts";




/**
 * Asychronous iterator for keypresses on stdin.
 * @param bufferLength The optional size to allocate for stdin reads.
 * @example
 * for await (const keypress of keydownEventListener()) {
    console.log(keypress);

    if (keypress.ctrl && keypress.key === 'c') {
      Deno.exit(0);
    }
  }
 */
export async function* keydownEventListener(bufferLength = 1024): AsyncIterableIterator<Keypress> {
    while (true) {
        const buffer = new Uint8Array(bufferLength);
        Deno.stdin.setRaw(true)
        const size = <number>await Deno.stdin.read(buffer)
        Deno.stdin.setRaw(false)
        const events = decodeKeypress(buffer.subarray(0, size));

        for (const event of events) {
            yield event;
        }
    }
}

