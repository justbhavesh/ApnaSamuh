// A "period" is a month, stored as "YYYY-MM" (e.g. "2026-06").

export function currentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTHS_HI = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function periodLabelHi(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS_HI[m - 1]} ${y}`;
}
