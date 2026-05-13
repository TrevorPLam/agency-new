/**
 * Detects if Global Privacy Control (GPC) is enabled.
 * Works in both browser and server (defaults to false on server if no header provided).
 */
export function isGpcEnabled(headers?: Record<string, string | string[] | undefined>): boolean {
  // Browser-side detection
  if (typeof window !== 'undefined' && (window as any).navigator?.globalPrivacyControl === true) {
    return true;
  }

  // Server-side detection via 'Sec-GPC' header
  if (headers) {
    const gpcHeader = headers['sec-gpc'] || headers['Sec-GPC'];
    return gpcHeader === '1';
  }

  return false;
}
