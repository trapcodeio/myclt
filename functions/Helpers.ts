import { OwnCltCommandFn, OwnCltCommandsObject } from "../Types/Custom";

export function defineCommands(commands: OwnCltCommandsObject) {
    return commands;
}

export function defineCommand(command: OwnCltCommandFn) {
    return command;
}
