"use client";

import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak, stopSpeaking } from "@/lib/kay/speech";

export function ReadAloudButton({ text, label = "Read aloud" }: { text: string; label?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => stopSpeaking, []);

  return (
    <Button
      variant="glass"
      className="h-10 shrink-0 rounded-full px-4"
      aria-pressed={on}
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
        } else {
          speak(text);
          setOn(true);
        }
      }}
    >
      {on ? <Square /> : <Volume2 />} {on ? "Stop" : label}
    </Button>
  );
}
