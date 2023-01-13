# Clack

Clack is a Deno module for reading keyboard events from the terminal.

```ts
import {keydownEvents} from "https://deno.land/x/clack/mod.ts"

for await (const keypress of keydownEventListener()) {
    console.log(keypress);

    if (keypress.ctrl && keypress.key === 'c') {
      Deno.exit(0);
    }
}
```