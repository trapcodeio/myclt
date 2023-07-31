import { OwnCltCommandFn, OwnCltCommandsObject } from "../types/Custom";

export function defineCommands(commands: OwnCltCommandsObject) {
    return commands;
}

export function defineCommand(command: OwnCltCommandFn) {
    return command;
}
