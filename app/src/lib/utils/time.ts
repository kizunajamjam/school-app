export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}
