import { config } from "dotenv";

export function loadEnv() {
  config(); // Load .env file
}
