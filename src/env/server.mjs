import { env as clientEnv, formatErrors } from "./client.mjs";
// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema } from "./schema.mjs";

const skipEnvValidation =
  process.env.SKIP_ENV_VALIDATION === "1" ||
  process.env.SKIP_ENV_VALIDATION === "true";

const _serverEnv = skipEnvValidation
  ? { success: true, data: process.env }
  : serverSchema.safeParse(process.env);

if (!skipEnvValidation && _serverEnv.success === false) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_serverEnv.error.format()),
  );
  throw new Error("Invalid environment variables");
}

/**
 * Validate that server-side environment variables are not exposed to the client.
 */
if (!skipEnvValidation) {
  for (const key of Object.keys(_serverEnv.data)) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      console.warn("❌ You are exposing a server-side env-variable:", key);

      throw new Error("You are exposing a server-side env-variable");
    }
  }
}

export const env = { ..._serverEnv.data, ...clientEnv };
