import type { ClipboardEvent, KeyboardEvent, MutableRefObject } from 'react';

type OtpDigitInputProps = {
  digits: string[];
  error?: string;
  inputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onChangeDigit: (index: number, value: string) => void;
  onKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
};

export function OtpDigitInput({
  digits,
  error,
  inputRefs,
  onChangeDigit,
  onKeyDown,
  onPaste
}: OtpDigitInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 p-4">
      <div className="grid flex-1 grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={digit}
            onChange={(event) => onChangeDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            onPaste={onPaste}
            inputMode="numeric"
            maxLength={1}
            className={`h-12 rounded-xl border bg-card text-center text-lg font-black text-foreground focus:outline-none focus:ring-1 transition-all ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border/50 focus:border-primary focus:ring-primary'
            }`}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
