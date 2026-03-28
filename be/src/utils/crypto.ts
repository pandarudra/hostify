import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { DEV_SETTINGS_SECRET } from "../constants/e.js";

// Encrypts text using AES-256-GCM and returns iv:tag:ciphertext (hex)
export function encryptSecret(plainText: string): string {
  if (!DEV_SETTINGS_SECRET) {
    throw new Error("DEV_SETTINGS_SECRET is not configured");
  }

  const key = createHash("sha256").update(DEV_SETTINGS_SECRET).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

// Decrypts iv:tag:ciphertext (hex) back to string
export function decryptSecret(payload: string): string {
  if (!DEV_SETTINGS_SECRET) {
    throw new Error("DEV_SETTINGS_SECRET is not configured");
  }

  const key = createHash("sha256").update(DEV_SETTINGS_SECRET).digest();
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
