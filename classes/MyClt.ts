/**
 * MyClt Class.
 *
 * Holds all the components myclt needs to run any command.
 */
import { MyCltConfig } from "../types";
import Path from "path";
import { installedOrInstall, loadCommandHandler, processCliQuery } from "../functions/tasks";
import MyCltDatabase from "./MyCltDatabase";
import { Obj } from "object-collection/exports";
import * as os from "os";

class MyClt {
    // started
    #started: boolean = false;
    // Config Data
    config: MyCltConfig;
    // Cache Holder as ObjectCollection
    #cache = Obj({});

    // Db Data Accessor
    db: MyCltDatabase;

    // Query Holder
    query?: {
        namespace: string;
        command: string;
        args: string[];
        subCommands: string[];
        commandHandler: string;
    };

    constructor(config: MyCltConfig) {
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
        const dbPath = this.dotMyCltPath("db.json");
        this.db = new MyCltDatabase(dbPath);

        // Set Db Path
        this.#cache.set("paths", { db: dbPath });
    }

    /**
     * The Start function is first called before any other function.
     * It starts processing all the data stored in the MyClt instance it belongs to
     */
    async start() {
        if (this.#started) return this;

        // Set Started to true
        this.#started = true;

        /**
         * Check if myclt has been installed, if Yes, skip the installation process.
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
     * Get MyClt Base Folder.
     */
    myCltPath(path?: string) {
        const key = "myCltPath";
        // Set to cache
        if (!this.#cache.has(key)) this.#cache.set(key, Path.dirname(this.config.caller));
        // get from cache
        return path ? Path.resolve(this.#cache.get(key) + "/" + path) : this.#cache.get(key);
    }

    /**
     * Get the .myclt folder path.
     * @param path
     */
    dotMyCltPath(path?: string) {
        return Path.resolve(os.homedir() + "/.myclt/" + (path || ""));
    }

    getCache<T = any>(key: string, def?: T): T {
        return this.#cache.get(key, def) as T;
    }

    setCache<T = any>(key: string, value: T): T {
        return this.#cache.set(key, value) as T;
    }
}

export default MyClt;
