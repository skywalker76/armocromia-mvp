import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility per combinare classi Tailwind CSS in modo sicuro.
 * Usa clsx per la logica condizionale e tailwind-merge per risolvere conflitti.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-accent text-white", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
