import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EN_DIGITS = ['0','1','2','3','4','5','6','7','8','9']
const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩']

/** Convert all ASCII digits in a string to Arabic-Indic digits */
export function toAr(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[EN_DIGITS.indexOf(d)])
}
