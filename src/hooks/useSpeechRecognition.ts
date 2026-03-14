"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const LANG_MAP: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
};

interface UseSpeechRecognitionOptions {
  language: "de" | "en";
  onResult: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  toggle: () => void;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({
  language,
  onResult,
  onInterim,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);

  // Keep callback refs fresh without re-creating recognition
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;

  const isSupported = typeof window !== "undefined" && getSpeechRecognitionConstructor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    // Abort any existing session
    recognitionRef.current?.abort();

    const recognition = new Ctor();
    recognition.lang = LANG_MAP[language] || "de-DE";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim && onInterimRef.current) {
        onInterimRef.current(interim);
      }

      if (final) {
        onResultRef.current(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" is expected when we call stop/abort manually
      if (event.error !== "aborted") {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, error, toggle };
}
