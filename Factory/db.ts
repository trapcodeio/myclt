import Path = require("path");
import { OwnCltMapFile } from "../Types/Custom";

export default () => ({
    updated: new Date(),
    commands: {
        clt: <OwnCltMapFile>{
            namespace: "clt",
            file: Path.resolve(__dirname, "../Commands/clt.js"),
            commands: {
                link: { desc: "Links a command to ownclt" }
            }
        }
    }
});
