import { OwnCltCommandsObject } from "../types";
import fs = require("fs");
import { spawn } from "child_process";
import ora = require("ora");

export default <OwnCltCommandsObject>{
    /**
     * runSubCommand
     */
    all: ({ self, state, args: [distFolder] }) => {
        // Set "ci" to true;
        state.set({
            ci: true,
            distFolder
        });

        // Run tsc
        self("tsc");
    },

    tsc: ({ paths, log, self, state }) => {
        // Start Spinner
        const spinner = ora(`Building typescript files...`).start();
        const Process = spawn("tsc", { cwd: paths.cwd });

        let stdout = "";

        Process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        Process.stderr.on("data", (data) => {
            stdout += data.toString();
        });

        Process.on("exit", (code) => {
            if (code !== 0) {
                spinner.clear();
                return log.errorAndExit(stdout);
            }

            // Update Spinner
            spinner.succeed("Typescript compiled.");

            // if ci mode then proceed
            if (state.has("ci")) {
                spinner.start("Preparing for publish...");
                // Run Prepare
                self("prepare");
                // Stop Spinner
                spinner.succeed("Ready for publishing.").stop();
            } else {
                spinner.stop();
            }
        });
    },

    /**
     * Prepare Command
     * This commands prepares my ts projects
     */
    prepare: ({
        // Args
        log,
        paths,
        args,
        fromSelf,
        state,
        self
    }) => {
        const base = paths.cwd;
        const packageDotJson = `${base}/package.json`;
        const distFolder = args[0] || state.get("distFolder", "dist");
        const distFolderPath = `${base}/${distFolder}`;
        const readme = `${base}/readme.md`;

        /**
         * Check if package.json exists
         */
        if (!fs.existsSync(packageDotJson)) {
            return log.errorAndExit(`No package.json found in working directory!`);
        }

        /**
         * Check if package.json exists
         */
        if (!fs.existsSync(distFolderPath)) {
            return log.errorAndExit(`No "${distFolder}" folder found in working directory!`);
        }

        /**
         * This file moves required package files to dist
         * e.g package.json
         */
        async function main() {
            const PackageDotJson = require(`${base}/package.json`);

            // Modify Package.json
            if (PackageDotJson.main) PackageDotJson.main = "index.js";
            if (PackageDotJson.types) PackageDotJson.types = "index.d.ts";

            // Copy Package.json
            fs.writeFileSync(
                `${base}/${distFolder}/package.json`,
                JSON.stringify(PackageDotJson, null, 2)
            );

            if (fs.existsSync(readme)) {
                // Copy readme.md
                fs.copyFileSync(`${base}/readme.md`, `${base}/${distFolder}/readme.md`);
            }

            if (!fromSelf) log.success(`You can now: npm publish ${distFolder}`);
        }

        main()
            .finally(() => {
                if (state.has("ci")) {
                    self("publish");
                }
            })
            .catch((e) => log.errorAndExit(e));
    },

    publish: ({ paths, log, state, args }) => {
        let [distFolder, ...others] = args;
        if (!distFolder) distFolder = state.get("distFolder", "./");

        const spinner = ora(`Publishing folder: ${distFolder}`).start();

        const Process = spawn("npm", ["publish", distFolder, ...others], { cwd: paths.cwd });

        let stdout = "";

        Process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        Process.stderr.on("data", (data) => {
            stdout += data.toString();
        });

        Process.on("exit", (code) => {
            if (code !== 0) {
                spinner.clear();
                return log.errorAndExit(stdout);
            }

            return spinner.succeed("Package published to npm successfully").stop();
        });
    }
};
