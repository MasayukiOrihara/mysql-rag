import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function f32(buf: number[]) {
  return Buffer.from(Float32Array.from(buf).buffer);
}
