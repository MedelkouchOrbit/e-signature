export const WatiqaSignLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Document shape */}
      <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#logoGradient)" />
      {/* Signature line */}
      <path d="M12 20 Q16 18 20 20 T28 20" stroke="white" strokeWidth="2" fill="none" />
      {/* Pen tip */}
      <circle cx="28" cy="20" r="2" fill="#fbbf24" />
    </svg>
  </div>
);