import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// TODO: Remove this dev bypass when multi-user auth is re-enabled.
// When no session exists, it uses the admin client with the owner user
// (role = 'owner') so all data is accessible during development.

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Logged in normally — get profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    return { supabase, user, profile }
  }

  // No session — use admin client to get the owner user (dev bypass)
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return { supabase, user: null, profile: null }
  }

  return { supabase: admin, user: { id: profile.id } as unknown as typeof user, profile }
}
