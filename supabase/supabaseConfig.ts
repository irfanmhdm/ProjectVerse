import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tvkiyrnqgfaehsakcflj.supabase.co";

const supabasePublishableKey =
  "sb_publishable_pVC979cBiQn2YFEYIVZsvQ_h5ekk4rI";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);