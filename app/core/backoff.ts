/** How long to pause polling after `failures` failed rounds in a row: 2 s, 4 s, 8 s, then 15 s. 0 after a success. */
export function backoffMs(failures: number): number {
  if (failures <= 0) return 0
  return Math.min(2 ** failures * 1000, 15_000)
}
