export function daysRemaining(end: Date, from: Date = new Date()) {
  return Math.max(0, Math.ceil((end.getTime() - from.getTime()) / 86_400_000));
}
