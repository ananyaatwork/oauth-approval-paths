// A stable hash of browser traits that survives clearing cookies and cache.
// It only gates the free research run; it is never stored unhashed.
export async function browserFingerprint(): Promise<string | null> {
  try {
    const parts: (string | number)[] = [
      navigator.userAgent,
      navigator.language,
      (navigator.languages ?? []).join(","),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen.width,
      screen.height,
      screen.colorDepth,
      window.devicePixelRatio,
      navigator.hardwareConcurrency ?? 0,
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
      navigator.maxTouchPoints ?? 0,
    ];

    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(10, 10, 100, 30);
      ctx.fillStyle = "#069";
      ctx.fillText("OAuth paths ✓ 2026", 4, 18);
      parts.push(canvas.toDataURL());
    }

    const gl = document.createElement("canvas").getContext("webgl") as WebGLRenderingContext | null;
    const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && dbg) parts.push(String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)), String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)));

    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("|")));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}
