import { db } from "./db";
import { GROUP_ID } from "./repo";
import { sha256Hex } from "./sha256";

// Member login is a short PIN set by the कोषाध्यक्ष. We store only the SHA-256 hash,
// never the PIN itself. Uses a pure-JS hash (not crypto.subtle) so it works over plain
// http on the LAN — phones reach the app at http://<PC-ip>, a non-secure context where
// crypto.subtle is unavailable. (Low-stakes village threat model; OTP can replace this
// later without changing the screens.)

export function hashPin(pin: string): string {
  return sha256Hex(pin.trim());
}

export async function setMemberPin(memberId: string, pin: string): Promise<void> {
  await db.members.update(memberId, { pinHash: hashPin(pin) });
}

// Returns the matching member id on success, or null. Matches by phone number.
export async function verifyMemberPin(
  phone: string,
  pin: string
): Promise<string | null> {
  const members = await db.members.where("groupId").equals(GROUP_ID).toArray();
  const hash = hashPin(pin);
  const match = members.find(
    (m) => m.phone.trim() === phone.trim() && m.pinHash === hash && m.active
  );
  return match?.id ?? null;
}
