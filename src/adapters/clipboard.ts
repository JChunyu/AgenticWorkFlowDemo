/**
 * Clipboard is an OS capability, so it stays behind the adapter boundary and
 * reports success instead of throwing — the caller decides how to degrade.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
