import * as loggers from "../functions/loggers";
import MyCltState from "../classes/MyCltState";
import ObjectCollection from "object-collection";
import MyClt from "../classes/MyClt";

export interface MyCltConfig {
    command: string;
    args: string[];
    caller: string;
}

export type MyCltLoggers = typeof loggers;
export type MyCltStore = {
    set(key: string | Record<string, any>, value?: any): void;
    get<T = any>(key: string, def?: T): T;
    has(key: string): boolean;
    unset(key: string): void;
    clear(): void;
    commitChanges(): void;
    collection<T extends Record<string, any>>(): ObjectCollection<T>;
};

export type MyCltCommandFnContext = {
    args: string[];
    command: string;
    subCommands: string[];
    log: MyCltLoggers;
    paths: { cwd: string; cwdResolve: (path?: string) => string };
    state: MyCltState;
    self: (name: string, args?: any | any[]) => any;
    fromSelf: boolean;
    myclt: () => MyClt;
    store: MyCltStore;
};

export type MyCltMapFile = {
    namespace: string;
    file: string;
    commands: Record<string, {
        desc: string,
        args?: {
            [key: string]:  `optional: ${string}` | string
        }
    }>;
};

export type MyCltDbCommandData = MyCltMapFile & {
    mapFile?: string;
};

export type MyCltCommandFn = (ctx: MyCltCommandFnContext) => any;
export type MyCltCommandsObject = { [key: string]: MyCltCommandFn | MyCltCommandsObject };

export function As<T>(data: T) {
    return data;
}
