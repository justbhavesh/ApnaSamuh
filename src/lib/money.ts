// All money is stored as integer paise to avoid floating-point rounding errors.
// ₹100 = 10000 paise.

export type Paise = number;

export const rupeesToPaise = (rupees: number): Paise => Math.round(rupees * 100);

export const paiseToRupees = (paise: Paise): number => paise / 100;

// Format paise as Indian-style rupees, e.g. 12450000 -> "₹1,24,500".
export function formatINR(paise: Paise): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}
