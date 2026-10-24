/**
 * Registration rules shared by the form (live feedback) and the route handler (enforcement).
 *
 * - Role Parent requires age 16+.
 * - Age 16+ (or Parent): the learner's own email is required and receives the verification link.
 * - Under 16: a parent's email is required; the account is registered to it so the parent
 *   receives the confirmation and activates the account. The learner's own email is optional.
 */
export type Role = "student" | "parent";

export type RegistrationInput = {
  name: string;
  role: Role | "";
  dob: string; // yyyy-mm-dd
  email: string;
  parentEmail: string;
  username: string;
  password: string;
  confirm: string;
};

export type FieldKey = keyof RegistrationInput;
export type EmailMode = "none" | "self" | "minor";

export const ADULT_AGE = 16;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[A-Za-z0-9_.]{4,20}$/;

export function ageFrom(dob: string, now?: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const today = now ?? new Date(); // only read the clock once there is a date to compare
  const [y, m, d] = dob.split("-").map(Number);
  let age = today.getFullYear() - y;
  const month = today.getMonth() + 1;
  if (month < m || (month === m && today.getDate() < d)) age -= 1;
  return age < 0 || age > 120 ? -1 : age;
}

export function emailMode(input: Pick<RegistrationInput, "dob" | "role">): EmailMode {
  const age = ageFrom(input.dob);
  if (age === null || age < 0) return "none";
  return age < ADULT_AGE && input.role !== "parent" ? "minor" : "self";
}

export function validate(input: RegistrationInput): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  const age = ageFrom(input.dob);
  const mode = emailMode(input);

  if (input.name.trim().length < 2) e.name = "Enter your name.";
  else if (input.name.trim().length > 60) e.name = "Keep your name under 60 characters.";
  if (!input.role) e.role = "Choose Student or Parent.";

  if (!input.dob) e.dob = "Enter your date of birth.";
  else if (age === null || age < 0) e.dob = "That date of birth doesn’t look right.";
  else if (age < 5) e.dob = "QuestNest is for ages 10 and up, with a grown-up.";
  else if (input.role === "parent" && age < ADULT_AGE) e.dob = "Parent accounts are for ages 16 and up. Choose Student instead.";

  if (mode === "self") {
    if (!input.email) e.email = "Enter your email.";
    else if (!EMAIL_RE.test(input.email)) e.email = "That email doesn’t look right.";
  }
  if (mode === "minor") {
    if (!input.parentEmail) e.parentEmail = "We need a parent’s email to activate your account.";
    else if (!EMAIL_RE.test(input.parentEmail)) e.parentEmail = "That email doesn’t look right.";
    if (input.email && !EMAIL_RE.test(input.email)) e.email = "That email doesn’t look right.";
    else if (input.email && input.email.trim().toLowerCase() === input.parentEmail.trim().toLowerCase())
      e.email = "Use a different email from your parent’s.";
  }

  if (!input.username) e.username = "Choose a username.";
  else if (!USERNAME_RE.test(input.username)) e.username = "Use 4–20 letters, numbers, dots or underscores.";

  if (!input.password) e.password = "Set a password.";
  else if (input.password.length < 8 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password))
    e.password = "At least 8 characters, with a letter and a number.";
  else if (input.password.length > 128) e.password = "Keep it under 128 characters.";

  if (!input.confirm) e.confirm = "Type your password again.";
  else if (input.confirm !== input.password) e.confirm = "Passwords don’t match.";
  return e;
}

/** The email the account is registered to (and where the confirmation goes). */
export function accountEmail(input: RegistrationInput): string {
  return (emailMode(input) === "minor" ? input.parentEmail : input.email).trim();
}
