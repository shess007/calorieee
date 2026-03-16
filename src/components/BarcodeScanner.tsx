"use client";

import { useRef, useCallback } from "react";
import { useZxing } from "react-zxing";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const scannedRef = useRef(false);

  const onDecodeResult = useCallback(
    (result: { getText: () => string }) => {
      if (scannedRef.current) return;
      const text = result.getText();
      if (text) {
        scannedRef.current = true;
        onScan(text);
      }
    },
    [onScan]
  );

  const { ref } = useZxing({
    onDecodeResult,
    constraints: {
      video: { facingMode: "environment" },
    },
    timeBetweenDecodingAttempts: 300,
  });

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
        <video
          ref={ref}
          className="h-full w-full object-cover"
        />
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-56 rounded-lg border-2 border-[#7cff6b]/40" />
        </div>
        {/* Scan line animation */}
        <div className="absolute left-1/2 top-1/2 h-24 w-56 -translate-x-1/2 -translate-y-1/2 overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-[#7cff6b]/60 animate-[scanLine_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <button
        onClick={onCancel}
        className="w-full cursor-pointer py-2.5 text-center text-xs text-white/20 transition-colors hover:text-white/40"
      >
        Abbrechen
      </button>
    </div>
  );
}
