/** HMAC-SHA256 helpers backed by Web Crypto. */
export async function hmacSha256Hex(payload: string, secret: string) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("CRYPTO_UNAVAILABLE: HMAC verification is unavailable here.");
  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyHmacSha256(payload: string, signature: string, secret: string) {
  const expected = await hmacSha256Hex(payload, secret);
  if (expected.length !== signature.length) return false;
  // Constant-time comparison.
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
