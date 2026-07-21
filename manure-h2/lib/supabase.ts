import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    ".env.local에 NEXT_PUBLIC_SUPABASE_URL이 없습니다.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    ".env.local에 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 없습니다.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
);