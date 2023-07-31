import { defineCommands } from "../../functions/Helpers";
import { errorAndExit, success } from "../../functions/Loggers";

export default defineCommands({
    set({ command, store, args }) {
        if (args.length < 2) {
            errorAndExit(`${command}: key and value are required!`);
        }

        const [key, value] = args;

        store.set(key, value);

        success(`${key} ==> ${value}`);
    },

    get({ command, store, args }) {
        if (args.length < 1) {
            errorAndExit(`${command}: key is required!`);
        }

        const [key] = args;

        if (!store.has(key)) {
            errorAndExit(`${command}: key ${key} not found!`);
        }

        const value = store.get(key);
        console.log(value);
    }
});
