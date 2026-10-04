/**
 * What counts as an acceptable password, in one place.
 *
 * There was no rule at all: `register` accepted any non-empty string, so "a"
 * was a valid password, and the admin reset endpoint accepted whatever the
 * panel sent - which was the constant "Temp123!" for every user. The project
 * book claims "standard security mechanisms ... secure login", and that claim
 * has to be true somewhere.
 *
 * Deliberately short rules rather than a long checklist: length is what
 * actually resists guessing, and a rule nobody can satisfy without a password
 * manager gets worked around with "Passw0rd!". Eight characters with at least
 * one letter and one digit is the common floor, and it is what the reset flow
 * now has to meet too - the two used to disagree because only one of them had
 * any rule at all.
 */

export const MIN_PASSWORD_LENGTH = 8;

/**
 * @param {unknown} password
 * @returns {string|null} what is wrong with it, or null when it is acceptable
 */
export function passwordProblem(password) {
    if (typeof password !== 'string' || !password) {
        return 'A password is required';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must contain at least one letter and one digit';
    }
    return null;
}
