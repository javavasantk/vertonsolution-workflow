import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const FORMAT = "scrypt";

/** Hash a password with a unique random salt using Node's memory-hard scrypt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${FORMAT}$${salt}$${derived.toString("base64url")}`;
}

/** Timing-safe validation for stored `scrypt$salt$hash` password records. */
export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [format, salt, encodedHash] = stored.split("$");
  if (format !== FORMAT || !salt || !encodedHash) return false;
  try {
    const expected = Buffer.from(encodedHash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
