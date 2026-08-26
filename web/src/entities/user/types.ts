/**
 * The Firestore version of this type also carried a `university` field
 * (bootstrapped into a per-user profile doc on first sign-in), but nothing
 * in the app ever reads it — `courses`/`user_courses` queries hardcode
 * "technion" directly. Supabase's `auth.users` already gives us a stable
 * user id, so there's no separate profile document to fetch/create here.
 */
type DiakstraUser = {
  userId: string;
};

export type { DiakstraUser };
