# MyClt

MyClt -
My command line tool is cli framework for creating custom commands with support to link commands from git repositories.


## Installation
Note: This package is best used if installed globally.

```bash
npm install -g myclt
# OR
yarn global add myclt
```

Or using npx: (This is not recommended as it will be slow to run commands and does not support the `clt` alias)

```bash
npx myclt <command>

# For example:
npx myclt /list
```


## Creating a command.
To create a command two files are needed.

1. The command file. (js or ts)
2. The command map file. (json)


### Typescript
Create a new project and install the `myclt` package.
The package is needed for type definitions but not required for the command to work.

Create a commands file @ `maths/index.ts` with the following content:

```ts
import {defineCommands} from "myclt/functions/Helpers";

export default defineCommands({
    add({log, args}) {
        const [x, y] = args.map(Number);
        log.info(`${x} + ${y} = ${x+y}`);
    },
    subtract({log, args}){
        const [x, y] = args.map(Number);
        log.info(`${x} - ${y} = ${x-y}`);
    }
});
```

Create a map file @ `maths/myclt.map.json` with the following content:

```json
{
  "namespace": "maths",
  "file": "./index.ts",
  "commands": {
    "add": {
      "desc": "Add two numbers"
    },
    "subtract": {
      "desc": "Subtract x from y"
    }
  }
}
```

Run the command below to link the command to myclt.

```bash
clt /link maths
```
