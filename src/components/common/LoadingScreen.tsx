import { Loader2 } from 'lucide-react';

type LoadingScreenProps = {
  message?: string;
  className?: string;
};

export default function LoadingScreen({ message, className = 'h-[100dvh]' }: LoadingScreenProps) {
  return (
    <div className={`flex items-center justify-center bg-background ${className}`}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        {message ? <p className="text-sm font-medium text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
}
