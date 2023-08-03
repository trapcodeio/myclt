# OwnClt

OwnCLT -
Own command line tool is cli framework for creating custom commands with support to link commands from git repositories.


## Installation
Note: This package is best used if installed globally.

```bash
npm install -g ownclt
# OR
yarn global add ownclt
```

Or using npx: (This is not recommended as it will be slow to run commands and does not support the `clt` alias)

```bash
npx ownclt <command>

# For example:
npx ownclt /list
```


## Creating a command.
To create a command two files are needed.

1. The command file. (js or ts)
2. The command map file. (json)


### Typescript
Create a new project and install the `ownclt` package.
The package is needed for type definitions but not required for the command to work.

Create a commands file @ `maths/index.ts` with the following content:

```ts
import {defineCommands} from "ownclt/functions/Helpers";

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

Create a map file @ `maths/ownclt.map.json` with the following content:

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

Run the command below to link the command to ownclt.

```bash
clt /link maths
```
