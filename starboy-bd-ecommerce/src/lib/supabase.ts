import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabase is used only for Storage/images in this project.
// All store data now comes from Firebase Firestore.
const noOpStorageClient = new Proxy(
  {} as SupabaseClient,
  {
    get() {
      return () => Promise.resolve({ data: null, error: null });
    },
  }
);

export const supabaseStorage: SupabaseClient =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : noOpStorageClient;
