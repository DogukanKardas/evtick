import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.test.local") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
