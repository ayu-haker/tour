export type UpiPayload = {
  pa: string; // payee address e.g. username@bank
  pn?: string; // payee name
  am?: string | number; // amount
  tn?: string; // note
  tr?: string; // transaction ref id
  cu?: "INR"; // currency
  url?: string; // bill url
};

export function validateUpiId(vpa: string) {
  const v = vpa.trim();
  // Simple validation: local@handle, allow dots, dashes, underscores
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(v);
}

export function buildUpiUri(p: UpiPayload) {
  const params = new URLSearchParams();
  params.set("pa", p.pa.trim());
  if (p.pn) params.set("pn", p.pn.trim());
  if (p.am !== undefined && p.am !== null && String(p.am).trim() !== "") params.set("am", String(p.am));
  if (p.tn) params.set("tn", p.tn);
  if (p.tr) params.set("tr", p.tr);
  params.set("cu", p.cu || "INR");
  if (p.url) params.set("url", p.url);
  return `upi://pay?${params.toString()}`;
}

export function qrUrl(data: string, size = 240) {
  // Use free QR server API
  const u = new URL("https://api.qrserver.com/v1/create-qr-code/");
  u.searchParams.set("data", data);
  u.searchParams.set("size", `${size}x${size}`);
  u.searchParams.set("margin", "0");
  return u.toString();
}
