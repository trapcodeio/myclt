import ObjectCollection = require("object-collection");
import * as fs from "fs";

class MyCltDatabase extends ObjectCollection {
    public dbPath: string;
    constructor(dbPath: string) {
        super({});

        this.dbPath = dbPath;
    }

    save() {
        try {
            fs.writeFileSync(this.dbPath, this.toJson());
            return true;
        } catch {
            return false;
        }
    }
}

export default MyCltDatabase;
