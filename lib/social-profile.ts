import { http } from "./learn-api";
import { socialApi } from "./social-api";
import type { AvatarId } from "./qn-data";

export type SocialProfile = { display_name: string; avatar: AvatarId; role: "learner" | "parent" };

/** Failed profile saves are retryable; presence never runs before a successful registration. */
export function createSocialHeartbeat(profile: SocialProfile, isActive: () => boolean = () => true) {
  let registered = false;
  let pending: Promise<Awaited<ReturnType<typeof socialApi.presence>>> | null = null;
  return () => {
    pending ??= (async () => {
      if (!registered) {
        await socialApi.saveMe(profile);
        await http.put("memory/profile", { role: profile.role, display_name: profile.display_name.slice(0, 40) });
        registered = true;
      }
      if (!isActive()) throw new DOMException("Presence stopped", "AbortError");
      try {
        return await socialApi.presence();
      } catch (error) {
        // Data deletion or a backend reset can remove the profile without ending the login.
        if (error instanceof Error && "code" in error && error.code === "profile_required") registered = false;
        throw error;
      }
    })().finally(() => { pending = null; });
    return pending;
  };
}
