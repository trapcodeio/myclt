import MyClt from "../classes/MyClt";
import * as fs from "fs";
import * as Path from "path";
import jsonpointer from "jsonpointer";
import * as log from "./loggers";

import FactoryDb from "../factory/db";
import {
    As,
    MyCltCommandFn,
    MyCltCommandFnContext,
    MyCltCommandsObject,
    MyCltMapFile,
    MyCltStore
} from "../types";
import MyCltState from "../classes/MyCltState";
import { Obj } from "object-collection/exports";
import ObjectCollection from "object-collection";
import { myclt_exec } from "./inbuilt";

/**
 * Loads the content of the database file as a collection.
 * @param self - MyClt Instance
 * @param path - Custom Path to db.json
 */
export function myclt_loadDbToCollection(self: MyClt, path?: string) {
    const cltDatabase = path ? path : self.dotMyCltPath("db.json");
    // Load db.json
    self.db.replaceData(require(cltDatabase));
}

/**
 * This functions checks for .myclt folder and database files.
 * if they don't exists, it tries creating them.
 * @param self - MyClt Instance
 */
export function myclt_installedOrInstall(self: MyClt) {
    const cltFolder = self.dotMyCltPath();
    const cltDatabase = self.dotMyCltPath("db.json");

    // Checkers
    const hasCltDb = fs.existsSync(cltDatabase);
    const hasCltFolder = hasCltDb ? true : fs.existsSync(cltFolder);

    // If has both folder and Db return
    if (hasCltFolder && hasCltDb) {
        // Load db.json
        myclt_loadDbToCollection(self, cltDatabase);

        // Stop and return true.
        return true;
    }

    // If no Clt folder
    if (!hasCltFolder) {
        try {
            fs.mkdirSync(cltFolder);
        } catch (e) {
            return log.errorAndExit(`Failed to create {.myclt} folder in ${cltFolder}`, e);
        }
    }

    // If no Clt Database
    if (!hasCltDb) {
        const factoryDb = FactoryDb();
        try {
            fs.writeFileSync(cltDatabase, JSON.stringify(factoryDb));
        } catch (e) {
            return log.errorAndExit(`Failed to create {db.json} folder in ${cltFolder}`, e);
        }
    }

    // Load db.json
    myclt_loadDbToCollection(self, cltDatabase);

    // Stop and return true.
    return true;
}

/**
 * Process Cli Query
 * @param self
 */
export function myclt_processCliQuery(self: MyClt) {
    const { command, args } = self.config;
    const commands = self.db.path("commands");

    // Get namespace from command
    // E.g `clt/link/this` where `clt` is namespace
    // while ['link', 'this'] are subCommands
    const [namespace, ...subCommands] = command.split("/");
    const commandMap = commands.get<MyCltMapFile>(namespace);

    if (!commandMap) {
        return log.warningAndExit(`Command "${command}" does not exists.`);
    }

    self.query = {
        args,
        command,
        namespace: commandMap.namespace,
        subCommands,
        commandHandler: commandMap.file
    };

    /**
     * Load Command Using data above.
     */
    return self.query;
}

/**
 * Loads the Handler file of a command
 * @param myclt
 */
export async function myclt_loadCommandHandler(myclt: MyClt) {
    // Throw error if instance has no query
    if (!myclt.query) {
        throw new Error(
            `No query in myclt instance, call processCliQuery() first before loadCommandHandler()`
        );
    }

    // Current Working Directory
    const cwd = process.cwd();

    // Destruct the needful
    const { commandHandler, subCommands, command } = myclt.query;

    let Commands: MyCltCommandsObject = {};

    try {
        // check if commandHandler is a ts file
        if (commandHandler.endsWith(".ts")) {
            // register ts-node
            require("ts-node/register/transpile-only");
        }

        Commands = require(Path.resolve(commandHandler));

        // check if it is default export
        if (Commands.default) {
            Commands = Commands.default as MyCltCommandsObject;
        }
    } catch (err: any) {
        return log.errorAndExit(err.message, err.stack);
    }

    if (typeof Commands === "object") {
        // if it has subcommands
        if (!subCommands.length) {
            return log.errorAndExit(`Command "${command}" is incomplete, requires a sub command.`);
        }

        /**
         * check if the first subcommand exists.
         */
        const mainSubCommandKey = subCommands[0];
        if (!Commands.hasOwnProperty(mainSubCommandKey)) {
            return log.warningAndExit(`Command "${command}" does not exists.`);
        }

        let mainSubCommand = Commands[mainSubCommandKey];

        /**
         * Check if mainSubCommand has subcommands
         */
        if (typeof mainSubCommand === "object") {
            try {
                let findSubCommand = jsonpointer.get(Commands, "/" + subCommands.join("/"));

                if (!findSubCommand) {
                    return log.warningAndExit(`Command "${command}" does not exists.`);
                } else if (findSubCommand && typeof findSubCommand !== "function") {
                    // check if object
                    if (
                        typeof findSubCommand === "object" &&
                        findSubCommand.hasOwnProperty("default")
                    ) {
                        const defaultSubCommand = findSubCommand["default"];

                        if (typeof defaultSubCommand !== "function") {
                            return log.errorAndExit(
                                `Default command handler for "${command}" must be a function`
                            );
                        }

                        findSubCommand = defaultSubCommand;
                    }
                }
                mainSubCommand = findSubCommand;
            } catch (e) {
                return log.errorAndExit(`Error finding command "${command}"`, e);
            }
        }

        if (typeof mainSubCommand !== "function")
            return log.errorAndExit(`command "${command}" is not callable!`);

        // Make Command Handler Context Data
        const data: MyCltCommandFnContext = {
            args: myclt.query.args,
            command: myclt.query.command,
            subCommands: myclt.query.subCommands,
            state: new MyCltState(),
            log,
            paths: {
                cwd,
                cwdResolve: (value) => {
                    return value ? Path.resolve(cwd, value) : cwd;
                }
            },
            self: undefined as any,
            fromSelf: false,
            myclt: () => myclt,
            store: myclt_makeStoreObject(myclt),
            exec: myclt_exec
        };

        // Setup self-function.
        data.self = function (name: string, args: any | any[] = []) {
            if (!Array.isArray(args)) args = [args];

            let thisFn;

            try {
                thisFn = jsonpointer.get(Commands, "/" + name);
            } catch (e) {
                return log.errorAndExit(`Error finding command: "${command}" in self!`, e);
            }

            if (!thisFn) {
                return log.errorAndExit(`No command named: "${name}" is defined in self!`);
            }

            if (typeof thisFn !== "function") {
                if (typeof thisFn === "object" && thisFn.hasOwnProperty("default")) {
                    thisFn = thisFn["default"];
                } else {
                    return log.errorAndExit(`Command: "${name}" is not callable in self!`);
                }
            }

            return thisFn(
                // set new data
                Obj(data)
                    .cloneThis()
                    .unset("args")
                    .set({
                        state: data.state,
                        args,
                        fromSelf: true
                    })
                    .all()
            );
        };

        return (mainSubCommand as MyCltCommandFn)(data);
    }
}

/**
 * Make Store Object
 * This function is used to make a store object
 * To prevent the user from accessing the db directly
 * It also ties the current namespace to the store object
 * @param myclt
 */
export function myclt_makeStoreObject(myclt: MyClt) {
    const obj = myclt.db.path("store").path(myclt.query!.namespace, {});

    return As<MyCltStore>({
        get: (key, def) => obj.get<any>(key, def),
        set: (key, value) => {
            // set value
            obj.set(key, value);
        },
        has: (key) => obj.has(key),
        unset: (key) => {
            // unset value
            obj.unset(key);
        },
        clear: () => {
            const keys = obj.keys();

            // unset value
            for (const key of keys) obj.unset(key);
        },
        commitChanges() {
            myclt.db.save();
        },
        /**
         * We are using a collection, because we don't want any inheritance with store.
         * returning the raw data would be a bad idea.
         */
        collection: <T extends Record<string, any>>() => obj.cloneThis() as ObjectCollection<T>
    });
}
