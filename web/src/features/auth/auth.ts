import { supabase } from "@/shared/supabase";

/**
 * Note: the local Supabase stack doesn't have a Google OAuth provider
 * configured yet (see supabase/config.toml's [auth.external.google] — it
 * needs real client_id/secret before this will actually redirect anywhere).
 * Email/password (below) is the sign-in method actually wired up for now.
 */
async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({ provider: "google" });
}

async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

async function signOutUser() {
  await supabase.auth.signOut();
}

export { signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser };
