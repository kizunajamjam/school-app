import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// RLS をバイパスする service role クライアント。
// クライアントコンポーネントから絶対に import しないこと。
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
