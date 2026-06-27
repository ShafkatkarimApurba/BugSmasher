/**
 * Checksum utility for game state integrity
 */

const SALT = 'smash_the_bugs_2026_FAANG_SECRET';

export class ChecksumSystem {
  /**
   * Generates a hash for a given object
   * Uses a static salt to make it harder to spoof
   */
  static async generate(data: unknown): Promise<string> {
    const serialized = JSON.stringify(this.sortObject(data));
    const msgBuffer = new TextEncoder().encode(serialized + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies if the data matches the provided checksum
   */
  static async verify(data: unknown, checksum: string): Promise<boolean> {
    if (!checksum) return false;
    const generated = await this.generate(data);
    return generated === checksum;
  }

  /**
   * Recursively sorts object keys to ensure deterministic serialization
   */
  private static sortObject(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(this.sortObject.bind(this));
    
    return Object.keys(obj as Record<string, unknown>).sort().reduce((acc: Record<string, unknown>, key) => {
      acc[key] = this.sortObject((obj as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
}
