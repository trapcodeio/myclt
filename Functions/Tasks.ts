import OwnClt from "../Classes/OwnClt";
import * as fs from "fs";
import * as Path from "path";
import jsonpointer from "jsonpointer";
import * as log from "./Loggers";

import FactoryDb from "../Factory/db";
import { OwnCltCommandFn, OwnCltCommandFnContext, OwnCltCommandsObject } from "../Types/Custom";
import OwnCltState from "../Classes/OwnCltState";
import { Obj } from "object-collection/exports";

/**
 * Loads the content of the database file as a collection.
 * @param self - Ownclt Instance
 * @param path - Custom Path to db.json
 */
export function loadDbToCollection(self: OwnClt, path?: string) {
    const cltDatabase = path ? path : self.ownCltPath(".ownclt/db.json");
    // Load db.json
    self.db.replaceData(require(cltDatabase));
}

/**
 * This functions checks for .ownclt folder and database files.
 * if they don't exists, it tries creating them.
 * @param self - Ownclt Instance
 */
export function installedOrInstall(self: OwnClt) {
    const cltFolder = self.ownCltPath(".ownclt");
    const cltDatabase = self.ownCltPath(".ownclt/db.json");

    // Checkers
    const hasCltDb = fs.existsSync(cltDatabase);
    const hasCltFolder = hasCltDb ? true : fs.existsSync(cltFolder);

    // If has both folder and Db return
    if (hasCltFolder && hasCltDb) {
        // Load db.json
        loadDbToCollection(self, cltDatabase);

        // Stop and return true.
        return true;
    }

    // If no Clt folder
    if (!hasCltFolder) {
        try {
            fs.mkdirSync(cltFolder);
        } catch (e) {
            return log.errorAndExit(`Failed to create {.ownclt} folder in ${cltFolder}`, e);
        }
    }

    // If no Clt Database
    if (!hasCltDb) {
        const factoryDb = FactoryDb();
        try {
            fs.writeFileSync(cltDatabase, JSON.stringify(factoryDb, null, 2));
        } catch (e) {
            return log.errorAndExit(`Failed to create {db.json} folder in ${cltFolder}`, e);
        }
    }

    // Load db.json
    loadDbToCollection(self, cltDatabase);

    // Stop and return true.
    return true;
}

/**
 * Process Cli Query
 * @param self
 */
export function processCliQuery(self: OwnClt) {
    const { command, args } = self.config;
    const commands = self.db.path("commands");

    // Get namespace from command
    // E.g `clt/link/this` where `clt` is namespace
    // while ['link', 'this'] are subCommands
    const [namespace, ...subCommands] = command.split("/");
    const commandHandler = commands.get(namespace);

    if (!commandHandler) {
        return log.warningAndExit(`Command "${command}" does not exists.`);
    }

    self.query = {
        args,
        command,
        subCommands,
        commandHandler
    };

    /**
     * Load Command Using data above.
     */
    return self.query;
}

/**
 * Loads the Handler file of a command
 * @param self
 */
export async function loadCommandHandler(self: OwnClt) {
    // Throw error if instance has no query
    if (!self.query) {
        throw new Error(
            `No query in ownclt instance, call processCliQuery() first before loadCommandHandler()`
        );
    }

    // Current Working Directory
    const cwd = process.cwd();

    // Destruct the needful
    const { commandHandler, subCommands, command } = self.query;

    let Commands: OwnCltCommandsObject = {};

    try {
        Commands = require(Path.resolve(commandHandler));
    } catch (err: any) {
        return log.errorAndExit(err.message, err.stack);
    }

    if (typeof Commands === "object") {
        // if has subcommands
        if (!subCommands.length) {
            return log.errorAndExit(`Command "${command}" is incomplete, requires subCommands.`);
        }

        /**
         * check if first subcommand exists.
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
                    const lastSubCommand = subCommands[subCommands.length - 1];
                    // check if object
                    if (
                        typeof findSubCommand === "object" &&
                        findSubCommand.hasOwnProperty(lastSubCommand)
                    ) {
                        const defaultSubCommand = findSubCommand[lastSubCommand];

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
        const data: OwnCltCommandFnContext = {
            args: self.query.args,
            command: self.query.command,
            subCommands: self.query.subCommands,
            state: new OwnCltState(),
            log,
            paths: {
                cwd,
                cwdResolve: (value) => {
                    return value ? Path.resolve(cwd, value) : cwd;
                }
            },
            self: undefined as any,
            fromSelf: false,
            ownclt: self
        };

        // Setup self function.
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
                return log.errorAndExit(`Command: "${name}" is not callable in self!`);
            }

            return thisFn(
                Obj(data)
                    .cloneThis()
                    .unset("args")
                    .set({ state: data.state, args, fromSelf: true })
                    .all()
            );
        };

        return (mainSubCommand as OwnCltCommandFn)(data);
    }
}
