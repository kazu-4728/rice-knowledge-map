"use client";

import { useCallback, useRef, useState } from "react";

// Web Speech API minimal types (not always available in TypeScript's lib.dom.d.ts)
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type ISpeechRecognitionCtor = new () => ISpeechRecognition;

function getSRConstructor(): ISpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: ISpeechRecognitionCtor; webkitSpeechRecognition?: ISpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Options = {
  onResult: (text: string) => void;
};

export function useSpeechRecognition({ onResult }: Options) {
  const [supported] = useState(() => !!getSRConstructor());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SR = getSRConstructor();
    if (!SR) return;

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let final = "";
      let inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else inter += t;
      }
      if (final) {
        onResult(final);
        setInterim("");
      } else {
        setInterim(inter);
      }
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.warn("[SpeechRecognition] error:", e.error);
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, interim, start, stop };
}
