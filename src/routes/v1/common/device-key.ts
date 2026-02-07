export function generateDeviceKey(bytes = 32) {
  // 32 bytes => 64 hex chars
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
