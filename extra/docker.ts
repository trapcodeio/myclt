import { OwnCltCommandFnContext, OwnCltCommandsObject } from "../types/Custom";
import * as path from "path";
import * as fs from "fs";

export default <OwnCltCommandsObject>{
    /**
     * FixMongoEnv
     * This commands replaces all local path in env to docker supported url.
     * @param args - Args received!
     * @param log - Log Functions
     * @param paths
     */
    fixMongoEnv: ({ log, paths }: OwnCltCommandFnContext) => {
        const currentEnv = path.resolve(`${paths.cwd}/.env`);

        if (!fs.existsSync(currentEnv)) {
            return log.errorAndExit(`No env found in working directory! ${paths.cwd}`);
        }

        const env = fs.readFileSync(currentEnv).toString();
        let dockerEnv = env
            .replace("mongodb://127.0.0.1:27017", "mongodb://mongodb:27017")
            .replace("mongodb://localhost:27017", "mongodb://mongodb:27017");

        fs.unlinkSync(currentEnv);
        fs.writeFileSync(currentEnv, dockerEnv);

        log.successAndExit("Docker env generated!");
    }
};
