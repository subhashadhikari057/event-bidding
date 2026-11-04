const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);
const TEN_THOUSAND = BigInt(10_000);

export function moneyToPaisa(value: string): bigint {
  const normalized = value.trim();
  if (!MONEY_PATTERN.test(normalized)) return ZERO;
  const [rupees, decimal = ""] = normalized.split(".");
  return BigInt(rupees) * HUNDRED + BigInt(decimal.padEnd(2, "0"));
}

export function paisaToMoney(value: bigint): string {
  const safe = value < ZERO ? ZERO : value;
  return `${safe / HUNDRED}.${(safe % HUNDRED).toString().padStart(2, "0")}`;
}

export function sumMoney(values: string[]): string {
  return paisaToMoney(values.reduce((total, value) => total + moneyToPaisa(value), ZERO));
}

export function paymentProgress(totalPaid: string, bookingAmount: string): number {
  const amount = moneyToPaisa(bookingAmount);
  if (amount <= ZERO) return 0;
  const paid = moneyToPaisa(totalPaid);
  const basisPoints = paid * TEN_THOUSAND / amount;
  return Math.min(100, Math.max(0, Number(basisPoints) / 100));
}

export function normalizeMoney(value: string): string {
  return paisaToMoney(moneyToPaisa(value));
}

export function currentLocalDateTime(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
