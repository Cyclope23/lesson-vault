import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required");
  return Buffer.from(key, "hex");
}

interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  const data: EncryptedData = {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    authTag: authTag.toString("hex"),
  };

  return JSON.stringify(data);
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const data: EncryptedData = JSON.parse(ciphertext);

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(data.authTag, "hex"));

  let decrypted = decipher.update(data.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return "****";
  return key.slice(0, 10) + "..." + "****";
}
