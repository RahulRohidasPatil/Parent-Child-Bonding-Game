import "server-only";

import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { ageFrom } from "@/lib/registration";

export type AuthUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
};

export type PublicUser = {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  accountType: "parent" | "learner" | null;
  age: number | null;
  demo: boolean;
};

export function toPublicUser(u: AuthUser): PublicUser {
  const meta = u.user_metadata || {};
  const name =
    typeof meta.display_name === "string" && meta.display_name.trim()
      ? meta.display_name
      : typeof meta.username === "string" && meta.username.trim()
        ? meta.username
        : (u.email?.split("@")[0] ?? "Friend");
  const accountType = meta.account_type;
  return {
    id: u.id,
    email: u.email,
    username: typeof meta.username === "string" && meta.username.trim() ? meta.username : null,
    name,
    accountType: accountType === "parent" || accountType === "learner" ? accountType : null,
    age: accountAge(meta.birth_date),
    demo: meta.demo === true,
  };
}

function accountAge(birthDate: unknown): number | null {
  const age = typeof birthDate === "string" ? ageFrom(birthDate) : null;
  return age !== null && age >= 0 ? age : null;
}

/** The signed-in Clerk user (display data). Learning-service access goes through lib/server/learning-session.ts. */
export async function currentUser(): Promise<{ user: AuthUser } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await clerkCurrentUser();
  if (!user) return null;
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  return {
    user: {
      id: user.id,
      email: primary?.emailAddress ?? null,
      email_confirmed_at: primary?.verification?.status === "verified" ? new Date().toISOString() : null,
      user_metadata: {
        display_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        username: user.username,
        ...(user.unsafeMetadata as Record<string, unknown>),
      },
    },
  };
}

export async function clearSession() {
  return undefined;
}

export class UpstreamError extends Error {
  constructor(public status: number) {
    super(`Upstream error ${status}`);
  }
}

export async function readDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) return String(body.detail[0].msg);
  } catch {
    /* not JSON */
  }
  return fallback;
}
