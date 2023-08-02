import { OwnCltCommandFn, OwnCltCommandsObject } from "../types";

export function defineCommands(commands: OwnCltCommandsObject) {
    return commands;
}

export function defineCommand(command: OwnCltCommandFn) {
    return command;
}
