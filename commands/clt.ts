import * as fs from "fs";
import * as path from "path";
import type { OwnCltMapFile } from "../Types/Custom";
import { defineCommands } from "../functions/Helpers";
import list from "./clt/list";
import { execSync } from "child_process";

export default defineCommands({
    context(ctx) {
        const data: Record<keyof typeof ctx, any> = ctx;
        delete data.log;

        console.dir(JSON.parse(JSON.stringify(ctx, null, 2)), { depth: 10 });
    },

    /**
     * Link Command
     * This command links the current working directory to ownclt commands.
     * @param args - Args received!
     */
    link: {
        default({ log, command, ownclt, state, args: [folder, as] }) {
            // Exit if no folder
            if (!folder) return log.errorAndExit(`${command}: Folder is required!`);

            // Resolve folder
            folder = path.resolve(folder);

            // Check if folder exits
            if (!fs.existsSync(folder))
                return log.errorAndExit(`${command}: Folder ${folder} does not exists`);

            // find ownclt.map.json
            const owncltMap = path.resolve(folder, "ownclt.map.json");
            if (!fs.existsSync(owncltMap))
                return log.errorAndExit(`${command}: OwnCltMap '${owncltMap}" does not exists`);

            let map: OwnCltMapFile;

            try {
                map = require(owncltMap);
            } catch (e) {
                return log.errorAndExit(
                    `${command}: Error while parsing map file: ${owncltMap}`,
                    e
                );
            }

            // Check if the command file exists
            map.file = path.resolve(folder, map.file);
            if (!fs.existsSync(map.file))
                return log.errorAndExit(
                    `${command}: OwnClt Command file: '${map.file}" does not exists.`
                );

            // Return map file
            if (state.has("readMapFileOnly")) {
                state.set("mapFile", map);
                return;
            }

            // get ownCliPath
            const db = ownclt().db;
            const namespace = (as ? as : map.namespace).trim().toLowerCase();

            // check if namespace exists
            if (db.has(`commands.${namespace}`)) {
                return log.errorAndExit(`${command}: Namespace "${namespace}" already exists.`);
            }

            // set command
            db.path(`commands.${namespace}`, map).set("mapFile", owncltMap);

            // Save db
            db.save();

            // Log
            return log.successAndExit(
                as
                    ? `Command Linked: "${map.namespace}" as "${namespace}"`
                    : `Command Linked: "${namespace}"`
            );
        },

        /**
         * Link Command from a git repo.
         * This command clones the git repo and links the directory to ownclt commands.
         */
        async git({ log, command, ownclt, args: [url, as] }) {
            // check if git exists
            try {
                execSync("git --version", { encoding: "utf8" });
            } catch (e) {
                return log.errorAndExit(`${command}: Git is not installed.`);
            }

            // Exit if no url
            if (!url) return log.errorAndExit(`${command}: Git URL is required!`);

            // ask for path to ownclt map file
            const readline = require("readline").createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const res = await new Promise<string>((resolve) => {
                readline.question("Path to ownclt.map.json: ", (path: string) => {
                    readline.close();
                    resolve(path);
                });
            });

            console.log(res);
        }
    },

    /**
     * UnLink Command
     * This commands unlinks the current working directory to ownclt commands.
     * @param args - Args received!
     * @param log - Log Functions
     */
    unlink: {
        default({ ownclt, command, args: [namespace], log }) {
            // check if namespace exists
            if (!namespace) {
                return log.errorAndExit(
                    `${command}: requires the "namespace" of the ownclt command.`
                );
            }

            namespace = namespace.toLowerCase();

            // Stop removal of self
            if (namespace === "clt")
                return log.warningAndExit(`Namespace: "${namespace}" cannot be unlinked.`);

            const db = ownclt().db;

            // check if namespace exists
            if (!db.has(`commands.${namespace}`)) {
                return log.errorAndExit(`Namespace "${namespace}" is not linked.`);
            }
            // unset command
            db.unset(`commands.${namespace}`);

            // Save db
            db.save();

            return log.successAndExit(`Command Unlinked: "${namespace}"`);
        },

        folder({ ownclt, state, self, command, args: [folder], log }) {
            // Exit if no folder
            if (!folder) return log.errorAndExit(`${command}: Folder is required!`);

            // Set State to readMapFileOnly
            state.set("readMapFileOnly", true);

            // call link
            self("link", folder);

            // Get mapFile
            const map: OwnCltMapFile = state.get("mapFile");

            const findKeyByFile = ownclt()
                .db.path("commands")
                .pickBy((d: any) => {
                    return d === map.file;
                });

            console.log(findKeyByFile);
            log.errorAndExit("stop");

            if (!findKeyByFile)
                return log.errorAndExit(`Namespace "${map.namespace}" is not linked.`);

            self("unlink/unlink", map.namespace);
        }
    },

    list,
    // alias
    ls: list
});
