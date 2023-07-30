import * as loggers from "../Functions/Loggers";
import OwnCltState from "../Classes/OwnCltState";
import OwnClt from "../Classes/OwnClt";

export interface OwnCltConfig {
    command: string;
    args: string[];
    caller: string;
}

export type OwnCltLoggers = typeof loggers;
export type OwnCltCommandFnContext = {
    args: string[];
    command: string;
    subCommands: string[];
    log: OwnCltLoggers;
    paths: { cwd: string; cwdResolve: (path?: string) => string };
    state: OwnCltState;
    self: (name: string, args?: any | any[]) => any;
    fromSelf: boolean;
    ownclt: () => OwnClt;
};

export type OwnCltMapFile = {
    namespace: string;
    file: string;
    commands: Record<string, { desc: string }>;
};

export type OwnCltDbCommandData = OwnCltMapFile & {
    mapFile?: string;
};

export type OwnCltCommandFn = (ctx: OwnCltCommandFnContext) => any;
export type OwnCltCommandsObject = { [key: string]: OwnCltCommandFn | OwnCltCommandsObject };
