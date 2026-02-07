export function toISO(d: Date): string;
export function toISO(d: Date | null): string | null;
export function toISO(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}
