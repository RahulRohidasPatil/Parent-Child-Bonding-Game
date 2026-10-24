/**
 * Read-aloud via the browser's built-in speech synthesis. Stand-in for the
 * recorded/AI voiceover planned in §4; works offline, no keys needed.
 */
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
