import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/config";

export interface ActiveProfile {
  id: string;
  role: AppRole;
  is_active: boolean;
}

export async function getActiveProfile(): Promise<ActiveProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile?.is_active) return null;
  return profile as ActiveProfile;
}

export async function requireAnyRole(allowedRoles: AppRole[]): Promise<ActiveProfile> {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login?error=account_not_provisioned");
  if (!allowedRoles.includes(profile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return profile;
}
