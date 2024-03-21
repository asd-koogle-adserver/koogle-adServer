import { createClient } from "@supabase/supabase-js";
import {
  PORT,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "../utils/get_env_variables";

const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

export {
  supabase,
};
