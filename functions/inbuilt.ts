import * as fs from "fs";
import { error, info } from "./loggers";
import { execSync } from "node:child_process";
import { ExecSyncOptions } from "child_process";

/**
 * Delete function
 * @param dir
 */
export function deleteDirectory(dir: string) {
    try {
        return fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        error(`Failed to delete ${dir}`);
        info(`Please delete ${dir} manually.`);
    }
}

/**
 * Execute a command just like you would in terminal
 * or in a bash script.
 */
export function myclt_exec(command: string | string[], options?: ExecSyncOptions) {
    if (typeof command === "string") {
        try {
            execSync(command, {
                stdio: "inherit",
                ...options
            });
        } catch (e: any) {
            console.log(e.message);
        }
    } else {
        for (const cmd of command) {
            myclt_exec(cmd, options);
        }
    }
}