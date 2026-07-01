export default function Logo({ size = 28 }: { size?: number }) {
  // Exact reproduction of the original option C ("गुल्लक · Savings pot") badge.
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="68" height="68" rx="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="30" y="16.5" width="12" height="6" rx="2" fill="#b45309" />
      <rect x="33" y="14.5" width="6" height="2.6" rx="1.3" fill="#78350f" />
      <path d="M20,42 Q20,25 36,25 Q52,25 52,42 Q52,57 36,57 Q20,57 20,42 Z" fill="#d97706" />
      <text
        x="36"
        y="47"
        fontSize="17"
        fontWeight="700"
        fill="#ffffff"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
      >
        ₹
      </text>
      <circle cx="16" cy="23" r="3.4" fill="#f59e0b" />
    </svg>
  );
}
