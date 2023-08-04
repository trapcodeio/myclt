import { defineCommands } from "../../functions/helpers";
import { MyCltDbCommandData } from "../../types";
import chalk from "chalk";
import type MyClt from "../../classes/MyClt";

export default defineCommands({
    /**
     * Default Command for:
     * `clt /list`
     */
    default({ myclt, log, args: [search] }) {
        const commands = getCommands(myclt());

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
            chalk.bold(
                chalk.dim(
                    `[Command]${" ".repeat(
                        longestKeyLength - "[Command]".length
                    )} ${pipe} [Description]`
                )
            )
        );

        // Print the separator
        console.log(chalk.dim("-".repeat(50 + longestKeyLength)));

        // Loop through all commands
        // if is search, only print the commands that match the search query
        // else print all commands
        let results = 0;
        let headerName: string | undefined;
        for (const [key, data] of Object.entries(commands)) {
            if (search) {
                if (!key.includes(search)) continue;
            }

            if (data.namespace !== headerName) {
                if (results) log.emptyLine();
                headerName = data.namespace;
                console.log(chalk.bold(`[${headerName}]`));
            }

            console.log(
                `${chalk.yellowBright(key)}${" ".repeat(
                    longestKeyLength - key.length
                )} ${pipe} ${chalk.cyan(data.desc)}`
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
 * Get Command's Object from myclt db
 * @param myclt
 */
function getCommands(myclt: MyClt) {
    const commands: Record<string, { namespace: string; desc: string }> = {};
    const dbCommands = myclt.db.get<Record<string, MyCltDbCommandData>>("commands");

    for (const [namespace, map] of Object.entries(dbCommands)) {
        // loop through each command
        for (const [command, { desc }] of Object.entries(map.commands)) {
            commands[namespace === "clt" ? `/${command}` : `${namespace}/${command}`] = {
                desc,
                namespace
            };
        }
    }

    return commands;
}
