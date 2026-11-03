import { createClient } from "@supabase/supabase-js";

import type { Database } from "./DatabaseTypes";

const SUPABASE_URL = "https://ghzhjzmjqqpryaqqmjjz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gQEwLmkhRmYeND72DaXwww_rzc6_YAV"

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export { supabase };
