import * as fs from "fs";
import { error, info } from "./loggers";

export function deleteDirectory(dir: string) {
    try {
        return fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        error(`Failed to delete ${dir}`);
        info(`Please delete ${dir} manually.`);
    }
}