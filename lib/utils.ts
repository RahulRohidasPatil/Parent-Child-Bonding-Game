export { cn } from "cn"

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ageFromDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (today < new Date(today.getFullYear(), date.getMonth(), date.getDate())) age -= 1;
  return age < 0 || age > 120 ? null : age;
}

export function getSignupMode(age: number | null, role: import("./types").Role | ""): import("./types").SignupMode {
  if (age !== null && age < 18 && role === "student") return "minor";
  if (age !== null && role === "parent") return "adult";
  return "none";
}
