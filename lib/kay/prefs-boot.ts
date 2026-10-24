export const PREFS_KEY = "kay.prefs";

/**
 * Inline <head> script: applies saved prefs to <html> before first paint so
 * dark mode / large text never flash.
 */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}");var d=document.documentElement;d.dataset.theme=p.theme||"light";d.dataset.text=p.text||"md";d.dataset.contrast=p.contrast||"normal";d.dataset.motion=p.motion||"full";}catch(e){}})();`;
