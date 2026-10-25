import { http } from "./learn-api";
import { applyPrefs, type Prefs } from "./prefs";
import { getAccountKey, setState } from "./store";
export type Profile = { display_name: string; daily_goal: number; avatar_reference: string | null; preferences: Prefs & { theme: "light" | "dark"; captions: boolean; read_aloud: boolean } };
export type SocialSettings = { share_presence: boolean; allow_game_invites: boolean };
let saves: Promise<unknown> = Promise.resolve();
export const settingsApi = {
  profile: () => http.get<Profile>("me/profile"),
  social: () => http.get<SocialSettings>("me/social-settings"),
  saveSocial: (settings: SocialSettings) => http.put<SocialSettings>("me/social-settings", settings),
  save(patch: Partial<Omit<Profile, "preferences">> & { preferences?: Partial<Profile["preferences"]> }) {
    const account = getAccountKey();
    const task = saves.catch(() => undefined).then(async () => {
      if (getAccountKey() !== account) throw new Error("The active account changed.");
      const old = await http.get<Profile>("me/profile");
      if (getAccountKey() !== account) throw new Error("The active account changed.");
      const saved = await http.put<Profile>("me/profile", { ...old, ...patch, preferences: { ...old.preferences, ...patch.preferences } });
      return saved;
    });
    saves = task;
    return task;
  },
  async load() {
    const account = getAccountKey();
    const [profile, social] = await Promise.all([settingsApi.profile(), settingsApi.social()]);
    if (getAccountKey() === account) {
      applyPrefs(profile.preferences);
      setState((s) => ({ settings: { ...s.settings, goal: ([10,15,20].includes(profile.daily_goal) ? profile.daily_goal : 15) as 10|15|20, aloud: profile.preferences.read_aloud, duelInvites: social.allow_game_invites } }));
    }
    return { profile, social };
  },
};
