import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

admin.initializeApp();

const SALT = process.env.CHECKSUM_SALT || 'smash_the_bugs_2026_FAANG_SECRET';

function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec)
    .sort()
    .reduce((acc: Record<string, unknown>, key) => {
      acc[key] = sortObject(rec[key]);
      return acc;
    }, {});
}

function generateChecksum(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(sortObject(data));
  return createHash('sha256')
    .update(serialized + SALT)
    .digest('hex');
}

/**
 * Validates save checksum before write (P1-07).
 */
export const validateSaveOnWrite = functions.firestore
  .document('users/{userId}/private/saves')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after?.data) return null;

    const payload = after.data as Record<string, unknown>;
    const checksum = after.checksum as string | undefined;
    if (!checksum) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Save must include server-verifiable checksum'
      );
    }

    const expected = generateChecksum(payload);
    if (expected !== checksum) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Save checksum mismatch — tampered data rejected'
      );
    }
    return null;
  });