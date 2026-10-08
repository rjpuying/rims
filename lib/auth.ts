import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  profileId: string;
  email: string;
  fullName: string;
  roleName: string;
  permissions: string[];
};

type ProfileWithRoleRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role_id: string;
  roles: {
    name: string;
    role_permissions: { permission: { code: string } | null }[];
  } | null;
};

export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const supabase = await createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, is_active, role_id, roles:role_id(name, role_permissions(permission:permissions(code)))",
      )
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    const profile = data as ProfileWithRoleRow | null;
    if (!profile || !profile.is_active || !profile.roles) return null;

    const permissions = (profile.roles.role_permissions ?? [])
      .map((rp) => rp.permission?.code)
      .filter((code): code is string => Boolean(code));

    return {
      id: authUser.id,
      profileId: profile.id,
      email: profile.email ?? authUser.email ?? "",
      fullName: profile.full_name ?? authUser.email ?? "User",
      roleName: profile.roles.name,
      permissions,
    };
  },
);

export async function requireUser(): Promise<SessionUser> {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function can(user: SessionUser, permission: string): boolean {
  return user.permissions.includes(permission);
}
