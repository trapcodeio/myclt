import { greenBright, blueBright, red, yellow } from "chalk";

/**
 * Log anything like console.log
 * @param args - Anything to log
 */
export function log(...args: any[]) {
    console.log(...args);
}

/**
 * Log then exit
 * @param args - Anything to log
 */
export function logAndExit(...args: any[]) {
    log(...args);
    process.exit();
}

/**
 * Log a success message
 * Adds the ✔✔ emoji
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function success(message: any, error?: Error) {
    log(greenBright("✔✔"), greenBright(message));
    if (error) console.log(error.stack);
}

/**
 * Log a success message then exit
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function successAndExit(message: any, error?: any) {
    success(message, error);
    process.exit();
}

/**
 * Log an info message
 * Adds the 🗣 emoji
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function info(message: any, error?: Error) {
    log(blueBright("🗣"), blueBright(message));
    if (error) console.log(error.stack);
}

/**
 * Log an info message then exit
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function infoAndExit(message: any, error?: any) {
    info(message, error);
    process.exit();
}

/**
 * Log an error message
 * Adds the 🚫 emoji
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function error(message: any, error?: Error) {
    log(red("🚫"), red(message));
    if (error) console.log(error.stack);
}

/**
 * Log an error message then exit
 * @param message - Message to log
 * @param e - Error stack to log
 */
export function errorAndExit(message: any, e?: any) {
    error(message, e);
    process.exit();
}

/**
 * Log a warning message
 * Adds the !! emoji
 * @param message - Message to log
 * @param error - Error stack to log
 */
export function warning(message: any, error?: Error) {
    log(yellow("!!"), yellow(message));
    if (error) console.log(error.stack);
}

/**
 * Log a warning message then exit
 * @param message - Message to log
 * @param error  - Error stack to log
 */
export function warningAndExit(message: any, error?: any) {
    warning(message, error);
    process.exit();
}

/**
 * Log an empty line
 */
export function emptyLine() {
    console.log();
}
