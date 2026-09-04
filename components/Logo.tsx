export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="none">
      <circle
        cx="12.5"
        cy="16"
        r="7.25"
        className="text-accent"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="19.5"
        cy="16"
        r="7.25"
        className="text-foreground"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
