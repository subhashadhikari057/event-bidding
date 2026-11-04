export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error('JWT_EXPIRES_IN must use a duration such as 15m, 24h, or 7d');
  }

  const amount = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return amount * multipliers[match[2] as keyof typeof multipliers];
}
