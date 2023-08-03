/**
 * OwnClt Class.
 *
 * Holds all the components ownclt needs to run any command.
 */
import { OwnCltConfig } from "../types";
import Path from "path";
import { installedOrInstall, loadCommandHandler, processCliQuery } from "../functions/Tasks";
import OwnCltDatabase from "./OwnCltDatabase";
import { Obj } from "object-collection/exports";
import * as os from "os";

class OwnClt {
    // started
    #started: boolean = false;
    // Config Data
    config: OwnCltConfig;
    // Cache Holder as ObjectCollection
    #cache = Obj({});

    // Db Data Accessor
    db: OwnCltDatabase;

    // Query Holder
    query?: {
        namespace: string;
        command: string;
        args: string[];
        subCommands: string[];
        commandHandler: string;
    };

    constructor(config: OwnCltConfig) {
        // Trim command
        config.command = config.command.trim();

        /**
         * Convert "/" to "clt/"
         * if command starts with a "/"
         */
        if (config.command[0] === "/") {
            config.command = "clt/" + config.command.substr(1);
        }

        // Set Config
        this.config = config;

        // Open Db Collection
        const dbPath = this.dotOwnCltPath("db.json");
        this.db = new OwnCltDatabase(dbPath);

        // Set Db Path
        this.#cache.set("paths", { db: dbPath });
    }

    /**
     * The Start function is first called before any other function.
     * It starts processing all the data stored in the OwnClt instance it belongs to
     */
    async start() {
        if (this.#started) return this;

        // Set Started to true
        this.#started = true;

        /**
         * Check if ownclt has been installed, if Yes, skip the installation process.
         */
        installedOrInstall(this);

        /**
         * Process command
         */
        processCliQuery(this);

        /**
         * Load Processed Command
         */
        await loadCommandHandler(this);

        return this;
    }

    /**
     * Get OwnClt Base Folder.
     */
    ownCltPath(path?: string) {
        const key = "ownCltPath";
        // Set to cache
        if (!this.#cache.has(key)) this.#cache.set(key, Path.dirname(this.config.caller));
        // get from cache
        return path ? Path.resolve(this.#cache.get(key) + "/" + path) : this.#cache.get(key);
    }

    /**
     * Get the .ownclt folder path.
     * @param path
     */
    dotOwnCltPath(path?: string) {
        return Path.resolve(os.homedir() + "/.ownclt/" + (path || ""));
    }

    getCache<T = any>(key: string, def?: T): T {
        return this.#cache.get(key, def) as T;
    }

    setCache<T = any>(key: string, value: T): T {
        return this.#cache.set(key, value) as T;
    }
}

export default OwnClt;
