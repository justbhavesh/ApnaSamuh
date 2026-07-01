import { formatINR, type Paise } from "./money";

// Build the WhatsApp / printable slip text that replaces the paper register entry.
export function depositSlip(
  groupName: string,
  memberName: string,
  amount: Paise,
  lateFee: Paise,
  totalFundAfter: Paise
): string {
  const date = new Date().toLocaleDateString("hi-IN");
  const feeLine =
    lateFee > 0 ? `\nविलंब शुल्क: ${formatINR(lateFee)}` : "";
  return (
    `🧾 ${groupName}\n` +
    `दिनांक: ${date}\n` +
    `${memberName} ने ${formatINR(amount)} जमा किया ✅${feeLine}\n` +
    `कुल कोष अब: ${formatINR(totalFundAfter)}`
  );
}

export function shareOnWhatsapp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
