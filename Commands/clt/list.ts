import { defineCommands } from "../../Functions/Helpers";
import { OwnCltDbCommandData } from "../../Types/Custom";
import chalk = require("chalk");
import type OwnClt from "../../Classes/OwnClt";

export default defineCommands({
    /**
     * Default Command for:
     * `clt /ls`
     * `clt /list`
     */
    default({ ownclt, log, args: [search] }) {
        const commands = getCommands(ownclt());

        log.emptyLine();

        if (search) search = search.toLowerCase();

        /**
         * Calculate the length of the key tab
         * This will be the length of the longest key + 10
         *
         * First find the length of the longest key.
         */
        let longestKeyLength = 0;
        for (const key of ["[Command]", ...Object.keys(commands)])
            longestKeyLength = Math.max(longestKeyLength, key.length);

        // add 5 to the longest key length to add some space
        longestKeyLength += 5;
        const pipe = chalk.dim("|");

        // Print the header
        console.log(
            `[Command]${" ".repeat(longestKeyLength - "[Command]".length)} ${pipe} [Description]`
        );

        // Print the separator
        console.log(chalk.dim("-".repeat(50 + longestKeyLength)));

        // Loop through all commands
        // if is search, only print the commands that match the search query
        // else print all commands
        let results = 0;
        for (const [key, desc] of Object.entries(commands)) {
            if (search) {
                if (!key.includes(search) && !desc.toLowerCase().includes(search)) continue;
            }

            console.log(
                `${chalk.yellowBright(key)}${" ".repeat(
                    longestKeyLength - key.length
                )} ${pipe} ${chalk.cyan(desc)}`
            );

            results++;
        }

        // Print the separator
        console.log(chalk.dim("-".repeat(50 + longestKeyLength)));

        if (search) {
            log.emptyLine();

            log.info(`Search query: ${chalk.yellowBright(`"${search}"`)}`);
            log.info(
                `Found ${chalk.yellowBright(results)} out of ${chalk.yellowBright(
                    Object.keys(commands).length
                )} commands.`
            );
        }

        log.emptyLine();
    }
});

/**
 * Get Command's Object from ownclt db
 * @param ownclt
 */
function getCommands(ownclt: OwnClt) {
    const commands: Record<string, string> = {};
    const dbCommands = ownclt.db.get<Record<string, OwnCltDbCommandData>>("commands");

    for (const [namespace, map] of Object.entries(dbCommands)) {
        // loop through each command
        for (const [command, { desc }] of Object.entries(map.commands)) {
            commands[namespace === "clt" ? `/${command}` : `${namespace}/${command}`] = desc;
        }
    }

    return commands;
}
