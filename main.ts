import { infoAndExit } from "./functions/loggers";
import MyClt from "./classes/MyClt";

async function Main() {
    // Process Args
    const [, , ...commands] = process.argv;

    // Check if commands have any command
    if (!commands || (commands && !commands.length)) {
        return infoAndExit(`No command provided!, Run "myclt /list" for more info.`);
    }

    // Get Command and Args
    const [command, ...args] = commands;

    // Initialize new MyClt
    const myclt = new MyClt({
        command, // myclt command
        args, // Args of myclt command
        caller: __filename // Current file path
    });

    // Boot MyClt
    await myclt.start();
}

Main().catch(console.log);
