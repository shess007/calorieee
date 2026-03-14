"use client";

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function MicButton({
  isListening,
  isSupported,
  disabled,
  onClick,
}: MicButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-shrink-0 rounded-[10px] border p-3 transition-all ${
        isListening
          ? "animate-[pulse-recording_1.5s_ease-in-out_infinite] border-red-500/40 bg-red-500/20 text-red-400"
          : "cursor-pointer border-white/[0.08] bg-white/[0.04] text-white/40 hover:border-[#7cff6b]/30 hover:bg-[#7cff6b]/10 hover:text-[#7cff6b]"
      } ${disabled ? "pointer-events-none opacity-30" : ""}`}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
}
