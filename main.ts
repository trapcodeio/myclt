import { infoAndExit } from "./functions/Loggers";
import OwnClt from "./classes/OwnClt";

async function Main() {
    // Process Args
    const [, , ...commands] = process.argv;

    // Check if commands have any command
    if (!commands || (commands && !commands.length)) {
        return infoAndExit(`No command provided!, Run "ownclt /list" for more info.`);
    }

    // Get Command and Args
    const [command, ...args] = commands;

    // Initialize new OwnClt
    const ownClt = new OwnClt({
        command, // ownclt command
        args, // Args of ownclt command
        caller: __filename // Current file path
    });

    // Boot OwnClt
    await ownClt.start();
}

Main().catch(console.log);
