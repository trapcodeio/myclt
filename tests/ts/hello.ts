import { defineCommands } from "../../functions/Helpers";

// const world = defineCommand((ci) => {
//     return ci.log.success("Hello World");
// });

export default defineCommands({
    world({ log }) {
        return log.success("Hello World");
    }
});
