import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Railway provides env vars directly, so we only load a local .env file when it exists.
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const requireEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const logEnvDiagnostics = (names) => {
  const diagnostics = names.reduce((result, name) => {
    result[name] = Boolean(process.env[name]);
    return result;
  }, {});

  console.log("Environment variable presence:", diagnostics);
};
