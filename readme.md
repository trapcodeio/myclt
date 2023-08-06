# MyClt

In most cases, `bash` wins when you want to create custom commands for your workflow.
But also in most cases, you will have to create a new file for each command and manage the files yourself.
`bash` is also limited in what you can do with it.

This is where `myclt` comes in as a framework that sets a structure for creating commands and managing them.
The good side is that you can use it alongside `bash` if you want to.
All you have to do is create a `clt` command that runs your `bash` command.
😁

**MyClt** -
My command line tool is a cli framework
for creating custom/reusable commands.
The framework supports linking commands both `locally` and `remotely` from git repositories.

`myclt` or `clt` is the command to run the framework. `clt` is only available if installed globally.

```bash
clt <namespace>/<command>/<subCommands> <args>
# OR
myclt <namespace>/<command>/<subCommands> <args>
```

- `namespace` is the namespace of the command defined in the `myclt.map.json` file.
- `command` is the command to run.
- `subCommands` is the child command to run. (optional)
- `args` is the arguments to pass to the command. (optional)



##### **Menu**

- [Installation](#installation)
- [Creating commands](#creating-commands)
    - [Javascript](#javascript)
    - [Typescript](#typescript)

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

## Creating commands.

To create a command, two files are needed.

1. The Command file (js or ts): The file where commands are defined.
2. The Map file (json): The file where the command is mapped to the command file.

### Javascript

Create a new project and install the `myclt` package.
The package is needed for type definitions but not required for the command to work.

Create a command file @ `maths/index.js` with the following content:

```js
const { defineCommands } = require("myclt/functions/helpers");

module.exports = defineCommands({
    add({ log, args }) {
        const [x, y] = args.map(Number);
        log.info(`${x} + ${y} = ${x + y}`);
    },
    subtract({ log, args }) {
        const [x, y] = args.map(Number);
        log.info(`${x} - ${y} = ${x - y}`);
    }
});
```

Create a map file @ `maths/myclt.map.json` with the following content:

```json
{
  "namespace": "maths",
  "file": "./index.js",
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

Run the command below to see the list of commands.

```bash
clt /list
```

You should see the [maths] namespace with the commands `add` and `subtract`.

### Typescript

`myclt` supports typescript out of the box.
All you need to do is change the file extension to `.ts`.

**Note:** it does not check for typescript errors, it only transpiles the file to javascript.
Your code editor should be able to check for typescript errors or you can use `tsc` to check for errors yourself.

## Command Action

A command action is a function that is called when a command is run.
This function is passed an object with the following properties:

| Property                      | Type       | Description                                                                                        |
|-------------------------------|------------|----------------------------------------------------------------------------------------------------| 
| [`args`](#args)               | `string[]` | The arguments passed to the command.                                                               |
| [`command`](#command)         | `string`   | The command that is currently running.                                                             |
| [`subCommands`](#subcommands) | `string[]` | The sub commands that are currently involved.                                                      |
| [`log`](#log)                 | `object`   | The logger instance that contains several methods for logging content to the console.              |
| [`paths`](#paths)             | `object`   | The paths object contains all the helper properties and methods for path parsing and intelligence. |
| [`self`](#self)               | `function` | A function that can be used to run other commands in same namespace.                               |
| [`state`](#state)             | `class`    | An [object-collection](https://npmjs.com/package/object-collection) instance.                      |                
| [`fromSelf`](#fromSelf)       | `boolean`  | A boolean that is true if the command was run from the same namespace.                             |
| [`myclt`](#myclt)             | `function` | A function that returns the myclt instance.                                                        |
| [`store`](#store)             | `object`   | A store object that contains methods for storing and retrieving persisted data.                    |


### `args`
The `args` property is an array of strings that contains the arguments passed to the command.

For example, if the command is `clt maths/add 1 2`, the `args` property will be `["1", "2"]`.
```ts
function action({ args }) {
    console.log(args); // ["1", "2"]
}
```


### `command`
The `command` property is the command that is currently running.

For example, if the command is `clt maths/add 1 2`, the `command` property will be `maths/add`.
```ts
function action({ command }) {
    console.log(command); // "maths/add"
}
```

### `subCommands`
The `subCommands` property is an array of strings that follows the command when you split it by `/`.

For example, if the command is `clt clt/link/git/update`, `command`
will be `clt/link` while `subCommands` will be `["git", "update"]`.
```ts
function action({ subCommands }) {
    console.log(subCommands); // ["git", "update"]
}
```

### `log`
The `log` property is an object that contains several methods for logging content to the console.

```ts
function action({ log }) {
    log.log("This is a log message");
    log.logAndExit("This is a log message and the process will exit");
    log.success("This is a success message");
    log.successAndExit("This is a success message and the process will exit");
    log.info("This is an info message");
    log.infoAndExit("This is an info message and the process will exit");
    log.error("This is a warning message");
    log.errorAndExit("This is a warning message and the process will exit");
    log.warning("This is a warning message");
    log.warningAndExit("This is a warning message and the process will exit");
    log.emptyLine()
}
```

Note:
these log functions can still be imported individually from
`myclt/functions/loggers` if you prefer to use them that way.

```ts
import { success, successAndExit } from "myclt/functions/loggers";

function action() {
    success("This is a success message");
    successAndExit("This is a success message and the process will exit");
}
```

### `paths`
The `paths` property is an object that contains all the helper properties and methods for path parsing and intelligence.

#### `paths.cwd`
The `cwd` property is the current working directory.

#### `paths.cwdResolve`
The `cwdResolve` property is a function that resolves a path relative to the current working directory.

### `self`
The `self` property is a function that can be used to run other commands in same namespace.

For example:

```ts
export default defineCommands({
  foo({ log, self }) {
    // call the bar command
    log.info("Calling bar command");
    self("bar");
  },
  bar({ log }) {
    log.info("Bar command called");
  }
});
```
### `state`
The `state` property is an [object-collection](https://npmjs.com/package/object-collection) instance
that holds the state of the command.

State is only useful when you want to persist data between commands.

For example:

```ts
export default defineCommands({
    foo({ state, self }) {
        state.set("isFoo", true);
        // call the bar command
        self("bar");
    },
    bar({ state, args }) {
        if (state.get("isFoo")) {
            console.log("Foo is true");
        }
    }
});
```

### `fromSelf`

The `fromSelf` property is a boolean that is true if the command was called using a `self` function.

### `myclt`
The `myclt` property is a function that returns the myclt instance.

### `store`
The `store` property is an object that contains methods for storing and retrieving persisted data.

The type structure of the store object is as follows:

```ts
type MyCltStore = {
  set(key: string | Record<string, any>, value?: any): void;
  get<T = any>(key: string, def?: T): T;
  has(key: string): boolean;
  unset(key: string): void;
  clear(): void;
  commitChanges(): void;
  collection<T extends Record<string, any>>(): ObjectCollection<T>;
};
```

So it can be used like this:

```ts
function action({ store }) {
    store.set("foo", "bar");
    // or
    store.set({ foo: "bar" });
    
    store.get("foo"); // "bar"
    store.has("foo"); // true
    store.unset("foo");
    store.clear();
    store.commitChanges(); // commit changes to disk
    store.collection().all(); // get all items
}
```