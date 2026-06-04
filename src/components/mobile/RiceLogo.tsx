export function RiceLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M8 29c4-11 12-17 25-18-6 4-10 10-11 18" fill="none" stroke="#2f8d41" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M12 30c4-6 9-10 15-11-4 3-6 7-7 12" fill="none" stroke="#2f8d41" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24 8c2 1 3 3 4 5M29 8c1 1 2 2 3 3M21 10c1 1 2 3 3 5" fill="none" stroke="#e1a11f" strokeLinecap="round" strokeWidth="2.1" />
    </svg>
  );
}
