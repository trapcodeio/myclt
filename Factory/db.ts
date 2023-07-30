import Path = require("path");

export = () => ({
    updated: new Date(),
    commands: {
        clt: Path.resolve(__dirname, "../Commands/clt.js")
    }
});
