import Path = require("path");
import { OwnCltDbCommandData } from "../Types/Custom";

export default () => ({
    updated: new Date(),
    commands: {
        clt: <OwnCltDbCommandData>{
            namespace: "clt",
            file: Path.resolve(__dirname, "../commands/clt.js"),
            commands: {
                link: { desc: "Links current working directory to ownclt." },
                unlink: {
                    desc: "Unlink a command from ownclt using namespace.",
                    args: {
                        namespace: "required: Namespace of command to unlink."
                    }
                },
                "unlink/folder": {
                    desc: "Unlinks a folder from ownclt.",
                    args: {
                        folder: "required: Folder to unlink."
                    }
                },
                list: {
                    desc: "List all declared commands using data stored in linked map files",
                    args: {
                        search: "Query to search for"
                    }
                }
            }
        }
    }
});
