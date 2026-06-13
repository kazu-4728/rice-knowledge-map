"use client";

import { useSpeechRecognition } from "../../lib/hooks/useSpeechRecognition";
import { IconMic } from "./icons";

type Props = {
  onText: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function VoiceInputButton({ onText, disabled = false, className = "" }: Props) {
  const { supported, listening, start, stop } = useSpeechRecognition({ onResult: onText });

  if (!supported) return null;

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={listening ? stop : start}
      disabled={disabled}
      aria-label={listening ? "音声入力を停止" : "音声で入力"}
      className={`flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 ${
        listening
          ? "animate-pulse bg-green-100 text-green-700"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      } ${className}`}
    >
      <IconMic className="h-4 w-4" />
    </button>
  );
}
