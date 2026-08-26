import { createClient } from "@supabase/supabase-js";

import type { Database } from "./DatabaseTypes";

const SUPABASE_URL = process.env.BUN_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.BUN_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "BUN_PUBLIC_SUPABASE_URL / BUN_PUBLIC_SUPABASE_ANON_KEY are not set (see web2/.env). " +
      "Only the anon/publishable key belongs here — never the service role key.",
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
