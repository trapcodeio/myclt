import * as fs from "fs";
import * as path from "path";
import type { MyCltMapFile } from "../types";
import { defineCommands } from "../functions/helpers";
import list from "./clt/list";
import { execSync } from "child_process";
import { deleteDirectory } from "../functions/inbuilt";

export default defineCommands({
    version({ myclt, log }) {
        const myClt = myclt();
        const pkgDotJson = path.resolve(myClt.myCltPath("package.json"));
        const pkg = require(pkgDotJson);
        log.info(pkg.version);
    },

    /**
     * `clt /context`
     * @param ctx
     */
    context(ctx) {
        const data: Record<keyof typeof ctx, any> = ctx;

        delete data.log;
        delete data.store;

        console.dir(JSON.parse(JSON.stringify(ctx, null, 2)), { depth: 10 });
    },

    /**
     * `clt /link`
     * Link Command
     * This command links the current working directory to myclt commands.
     * @param args - Args received!
     */
    link: {
        default({ log, command, myclt, state, args: [folder, as] }) {
            // Exit if no folder
            if (!folder) return log.errorAndExit(`${command}: Folder is required!`);

            // Resolve folder
            folder = path.resolve(folder);

            // Check if folder exits
            if (!fs.existsSync(folder))
                return log.errorAndExit(`${command}: Folder ${folder} does not exists`);

            // find myclt.map.json
            const mycltMap = path.resolve(folder, "myclt.map.json");
            if (!fs.existsSync(mycltMap))
                return log.errorAndExit(`${command}: MyCltMap '${mycltMap}" does not exists`);

            let map: MyCltMapFile;

            try {
                map = require(mycltMap);
            } catch (e) {
                return log.errorAndExit(`${command}: Error while parsing map file: ${mycltMap}`, e);
            }

            // Check if the command file exists
            map.file = path.resolve(folder, map.file);
            if (!fs.existsSync(map.file))
                return log.errorAndExit(
                    `${command}: MyClt Command file: '${map.file}" does not exists.`
                );

            // Return map file
            if (state.has("readMapFileOnly")) {
                state.set("mapFile", map);
                return;
            }

            // get myCliPath
            const db = myclt().db;
            const namespace = (as ? as : map.namespace).trim().toLowerCase();

            // check if namespace exists
            if (db.has(`commands.${namespace}`)) {
                return log.errorAndExit(`${command}: Namespace "${namespace}" already exists.`);
            }

            // set command
            db.path(`commands.${namespace}`, map).set("mapFile", mycltMap);

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
         * `clt /link/git`
         * Link Command from a git repo.
         * This command clones the git repo and links the directory to myclt commands.
         */
        git: {
            default({ log, command, myclt, self, state, args: [url, folder, as] }) {
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

                const myClt = myclt();
                const gitCommandsFolder = myClt.dotMyCltPath("commands/git");

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
                        deleteDirectory(gitFolder)
                    } else {
                        isEmpty = false;
                    }
                }

                if (isEmpty) {
                    try {
                        log.info(`Cloning into: ${gitFolder}...`);
                        execSync(`git clone ${url} ${gitFolder}`, {
                            encoding: "utf8",
                            cwd: gitCommandsFolder,
                            stdio: "ignore"
                        });
                    } catch (e: any) {
                        return log.errorAndExit(`${command}: Error while cloning git repo: ${url}`);
                    }
                }

                // check if package.json exists in git repo
                const pkgDotJson = path.resolve(gitFolder, "package.json");
                const nodeModules = path.resolve(gitFolder, "node_modules");

                // if package.json exists, install dependencies
                if (fs.existsSync(pkgDotJson) && !fs.existsSync(nodeModules)) {
                    try {
                        log.info("Installing dependencies...");
                        execSync("npm install", {
                            encoding: "utf8",
                            cwd: gitFolder,
                            stdio: "ignore"
                        });
                    } catch (e: any) {
                        return log.errorAndExit(`${command}: Error while installing dependencies.`);
                    }
                }

                // stop if updating
                if (isUpdating) return;

                if (folder.startsWith("/")) {
                    // remove the first slash
                    folder = folder.slice(1);
                }

                // check if the path to map file exists
                const mapFileFolder = path.resolve(gitFolder, folder);
                const mapFile = path.resolve(mapFileFolder, "myclt.map.json");

                if (!fs.existsSync(mapFile)) {
                    // delete the folder
                    deleteDirectory(gitFolder)

                    return log.errorAndExit(
                        `${command}: Map file not found in repo path: "${repo + "/" + folder}"`
                    );
                }

                // call link command
                self("link", [mapFileFolder, as]);
            },

            /**
             * `clt /link/git/update`
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
     * `clt /unlink`
     * UnLink Command
     * This commands unlinks the current working directory to myclt commands.
     * @param args - Args received!
     * @param log - Log Functions
     */
    unlink: {
        default({ myclt, command, args: [namespace], log }) {
            // check if namespace exists
            if (!namespace) {
                return log.errorAndExit(
                    `${command}: requires the "namespace" of the myclt command.`
                );
            }

            namespace = namespace.toLowerCase();

            // Stop removal of self
            if (namespace === "clt")
                return log.warningAndExit(`Namespace: "${namespace}" cannot be unlinked.`);

            const db = myclt().db;

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

        /**
         * `clt /unlink/folder`
         */
        folder({ myclt, state, self, command, args: [folder], log }) {
            // Exit if no folder
            if (!folder) return log.errorAndExit(`${command}: Folder is required!`);

            // Set State to readMapFileOnly
            state.set("readMapFileOnly", true);

            // call link
            self("link", folder);

            // Get mapFile
            const map: MyCltMapFile = state.get("mapFile");

            const filter = myclt()
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
