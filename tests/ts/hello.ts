import { defineCommands } from "../../functions/Helpers";

// const world = defineCommand((ci) => {
//     return ci.log.success("Hello World");
// });

export default defineCommands({
    world() {
        console.log("Hello World");
    }
});
