import * as argon2 from 'argon2';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../config/adminAuth.js';

export interface PasswordValidationInput {
  newPassword: string;
  confirmPassword: string;
  /**
   * If provided, verifies that `newPassword` does not equal the current
   * password (D3). Uses argon2 verify against the stored hash.
   */
  currentPasswordHash?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  /** Field-keyed error messages (D6). Empty when `valid` is `true`. */
  errors: Record<string, string>;
}

/**
 * Server-side password policy validator (D1–D7).
 *
 * Used identically by the password-reset flow and the settings-change flow
 * so policy is enforced in one place regardless of call site (D7).
 *
 * All violations produce a specific, field-level message (D6).
 * No change is made to any external state — this is a pure validation
 * function; the caller is responsible for applying the change.
 */
export async function validatePassword(
  input: PasswordValidationInput,
): Promise<PasswordValidationResult> {
  const { newPassword, confirmPassword, currentPasswordHash } = input;
  const errors: Record<string, string> = {};

  // --- D1: length constraints -----------------------------------------------
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword =
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (newPassword.length > PASSWORD_MAX_LENGTH) {
    errors.newPassword =
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  } else {
    // --- D2: character-class requirements (checked only when length is valid) --
    if (!/[a-z]/.test(newPassword)) {
      errors.newPassword =
        'Password must contain at least one lowercase letter.';
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword =
        'Password must contain at least one uppercase letter.';
    } else if (!/\d/.test(newPassword)) {
      errors.newPassword =
        'Password must contain at least one digit.';
    }
  }

  // --- D3: must not equal current password ----------------------------------
  // Only evaluated when there are no other newPassword errors (avoid leaking
  // the hash via verify timing when the input is already invalid).
  if (!errors.newPassword && currentPasswordHash !== undefined) {
    const sameAsCurrent = await argon2.verify(currentPasswordHash, newPassword);
    if (sameAsCurrent) {
      errors.newPassword =
        'New password must be different from your current password.';
    }
  }

  // --- D4: confirmation must match ------------------------------------------
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
