"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

function detach(rec: ISpeechRecognition) {
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
}

type Options = {
  onResult: (text: string) => void;
};

export function useSpeechRecognition({ onResult }: Options) {
  const [supported] = useState(() => !!getSRConstructor());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        detach(recognitionRef.current);
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    const SR = getSRConstructor();
    if (!SR) return;

    // Stop any previous instance before creating a new one
    if (recognitionRef.current) {
      detach(recognitionRef.current);
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

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
      recognitionRef.current = null;
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      console.warn("[SpeechRecognition] start failed:", err);
      detach(rec);
      recognitionRef.current = null;
    }
  }, [onResult]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    detach(rec);
    recognitionRef.current = null;
    rec.stop();
    setListening(false);
    setInterim("");
  }, []);

  return { supported, listening, interim, start, stop };
}
