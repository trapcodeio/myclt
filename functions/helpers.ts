import type { MyCltCommandFn, MyCltCommandsObject } from "../types";

export function defineCommands(commands: MyCltCommandsObject) {
    return commands;
}

export function defineCommand(command: MyCltCommandFn) {
    return command;
}
