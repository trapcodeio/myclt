import Path = require("path");

export = () => ({
    updated: new Date(),
    commands: {
        clt: Path.resolve(__dirname, "../Commands/clt.js"),
        ts: Path.resolve(__dirname, "../Commands/ts.js"),
        docker: Path.resolve(__dirname, "../Commands/docker.js")
    }
});
