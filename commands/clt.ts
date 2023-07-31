import * as fs from "fs";
import * as path from "path";
import type { OwnCltMapFile } from "../types/Custom";
import { defineCommands } from "../functions/Helpers";
import list from "./clt/list";
import { execSync } from "child_process";

export default defineCommands({
    context(ctx) {
        const data: Record<keyof typeof ctx, any> = ctx;

        delete data.log;
        delete data.store;

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
        git: {
            default({ log, command, ownclt, self, state, args: [url, folder, as] }) {
                const isUpdating = state.get<boolean>("updateGitFolderOnly", false);

                // check if git exists
                try {
                    execSync("git --version", { encoding: "utf8" });
                } catch (e) {
                    return log.errorAndExit(`${command}: Git is not installed.`);
                }

                // Exit if no url
                if (!url) return log.errorAndExit(`${command}: Git URL is required!`);

                // url should be a git url
                if (!url.startsWith("git@") && !url.startsWith("https://")) {
                    return log.errorAndExit(`${command}: Invalid Git URL!`);
                }

                // Exit if no path
                if (!folder && !isUpdating)
                    return log.errorAndExit(`${command}: Map folder is required!`);

                if (folder.startsWith("/")) {
                    // remove the first slash
                    folder = folder.slice(1);
                }

                const ownClt = ownclt();
                const gitCommandsFolder = ownClt.dotOwnCltPath("commands/git");

                // generate git destination folder
                // this should be the username/repo format
                // we have to get this info from the url
                const split = url.split("/");

                // get the last two items
                let repo = split.slice(-2).join("/");
                // remove .git from the repo name
                repo = repo.replace(".git", "");

                const gitFolder = path.resolve(gitCommandsFolder, repo);

                // check if folder exits
                if (!fs.existsSync(gitFolder)) {
                    fs.mkdirSync(gitFolder, { recursive: true });
                }

                // check if the folder is empty
                let isEmpty = true;
                if (fs.readdirSync(gitFolder).length > 0) {
                    if (isUpdating) {
                        // delete the folder
                        fs.rmSync(gitFolder, { recursive: true });
                    } else {
                        isEmpty = false;
                    }
                }

                if (isEmpty) {
                    try {
                        execSync(`git clone ${url} ${gitFolder}`, {
                            encoding: "utf8",
                            cwd: gitCommandsFolder,
                            stdio: "inherit"
                        });
                    } catch (e: any) {
                        return log.errorAndExit(`${command}: Error while cloning git repo: ${url}`);
                    }
                }

                // stop if updating
                if (isUpdating) return;

                // check if the path to map file exists
                const mapFileFolder = path.resolve(gitFolder, folder);
                const mapFile = path.resolve(mapFileFolder, "ownclt.map.json");

                if (!fs.existsSync(mapFile))
                    return log.errorAndExit(
                        `${command}: Map file not found in repo path: "${repo + "/" + folder}"`
                    );

                // call link command
                self("link", [mapFileFolder, as]);
            },

            /**
             * Update Command from a git repo.
             */
            update({ state, args, self, log }) {
                // set state
                state.set("updateGitFolderOnly", true);

                // call git link command
                self("link/git", args);

                log.emptyLine();
                return log.successAndExit(`Command source codes have been updated: "${args[0]}"`);
            }
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

            const filter = ownclt()
                .db.path("commands")
                .pickBy((d: any) => {
                    return d.file === map.file;
                });

            // check if the filter is empty
            if (Object.keys(filter).length === 0) {
                return log.errorAndExit(`No command with namespace: "${map.namespace}" found.`);
            }

            const namespace = Object.keys(filter)[0];

            if (namespace !== map.namespace) {
                log.info(`Found command: "${map.namespace}" as "${namespace}"`);
            } else {
                log.info(`Found command: "${map.namespace}"`);
            }

            // call unlink
            self("unlink", namespace);
        }
    },

    list
});
