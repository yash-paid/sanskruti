/**
 * Date and Age Utilities for CONNECT
 * Ensures strict 18+ age verification for Date of Birth inputs.
 */

/**
 * Calculates user's age in full completed years from a YYYY-MM-DD date string.
 * Uses local calendar date components to avoid any UTC timezone offset shifts.
 * @param {string} dobString - e.g. "2000-01-01"
 * @returns {number} Age in full years
 */
export const calculateAge = (dobString) => {
  if (!dobString) return 0;
  const parts = String(dobString).split('-');
  if (parts.length !== 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed month
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age;
};

/**
 * Returns the maximum allowed date string (YYYY-MM-DD) for users to be at least 18 years old.
 * Any date after this date makes the user under 18.
 * Used for <input type="date" max={getMaxDobFor18Plus()} />
 * @returns {string} YYYY-MM-DD string
 */
export const getMaxDobFor18Plus = () => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const yyyy = maxDate.getFullYear();
  const mm = String(maxDate.getMonth() + 1).padStart(2, '0');
  const dd = String(maxDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Checks if a given YYYY-MM-DD date corresponds to an age >= 18.
 * @param {string} dobString
 * @returns {boolean}
 */
export const isAtLeast18 = (dobString) => {
  return calculateAge(dobString) >= 18;
};

