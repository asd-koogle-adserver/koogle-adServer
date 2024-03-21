import { load } from "ts-dotenv";

export const {
//   NODE_ENV,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  PORT,
} = load({
//   NODE_ENV: ["production" as const, "development" as const, "staging" as const],
  SUPABASE_URL: String,
  SUPABASE_ANON_KEY: String,
  PORT: Number,
});