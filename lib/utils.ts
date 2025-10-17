import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function f32(buf: number[]) {
  return Buffer.from(Float32Array.from(buf).buffer);
}

// Buffer -> Float32Array
export const bufToF32 = (b: Buffer) =>
  new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
