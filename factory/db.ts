import Path = require("path");
import { OwnCltDbCommandData } from "../types/Custom";

export default () => ({
    updated: new Date(),
    commands: {
        clt: <OwnCltDbCommandData>{
            namespace: "clt",
            file: Path.resolve(__dirname, "../commands/clt.js"),
            commands: {
                context: { desc: "Prints the context of a command." },
                link: { desc: "Links current working directory to ownclt." },
                "link/git": {
                    desc: "Links a git repository to ownclt.",
                    args: {
                        url: "required: Git repository url to link.",
                        folder: "required: Path to map file in repository."
                    }
                },
                "link/git/update": {
                    desc: "Updates a git repository linked to ownclt.",
                    args: {
                        url: "required: Git repository url to link."
                    }
                },
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
