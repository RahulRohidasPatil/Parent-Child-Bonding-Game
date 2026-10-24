/** Display preferences, applied to <html> before first paint and edited in Settings. */
export const PREFS_KEY = "qn.prefs";

export type Prefs = {
  text: "md" | "lg" | "xl";
  contrast: "normal" | "more";
  motion: "full" | "reduce";
};

export const DEFAULT_PREFS: Prefs = { text: "md", contrast: "normal", motion: "full" };

export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}");var d=document.documentElement;d.dataset.text=p.text||"md";d.dataset.contrast=p.contrast||"normal";d.dataset.motion=p.motion||"full";}catch(e){}})();`;

export function applyPrefs(p: Prefs) {
  const d = document.documentElement;
  d.dataset.text = p.text;
  d.dataset.contrast = p.contrast;
  d.dataset.motion = p.motion;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* storage can be unavailable; the setting still applies for this visit */
  }
}

export function readPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}
