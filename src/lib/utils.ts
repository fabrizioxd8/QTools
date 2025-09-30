import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Tool } from "@/contexts/AppDataContext";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusBadgeClasses = (status: Tool['status']) => {
  switch (status) {
    case 'Available':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700/40';
    case 'In Use':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-700/40';
    case 'Damaged':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-700/40';
    case 'Lost':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-700/40';
    case 'Cal. Due':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700/40';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};