const { defineCommand, defineCommands } = require("../functions/Helpers");

const world = defineCommand((ci) => {
    return ci.log.success("Hello World");
});

module.exports = defineCommands({ world });
