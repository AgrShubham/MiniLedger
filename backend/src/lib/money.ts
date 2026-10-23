/**
 * Money utilities for integer minor units (paise/cents)
 */

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

/**
 * Converts decimal currency (e.g. 1500.50) to minor units integer (e.g. 150050).
 * Throws InvalidMoneyError if value is invalid, negative, or has more than 2 decimals.
 */
export function toMinor(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new InvalidMoneyError('Amount must be a valid number');
  }

  if (amount < 0) {
    throw new InvalidMoneyError('Amount cannot be negative');
  }

  // Check decimal places
  const parts = amount.toString().split('.');
  if (parts.length === 2 && parts[1].length > 2) {
    throw new InvalidMoneyError('Amount cannot have more than 2 decimal places');
  }

  // Avoid precision issues: round to nearest integer
  return Math.round(amount * 100);
}

/**
 * Converts integer minor units (e.g. 150050) to decimal currency (e.g. 1500.5).
 */
export function toMajor(amountMinor: number): number {
  if (typeof amountMinor !== 'number' || isNaN(amountMinor) || !isFinite(amountMinor)) {
    throw new InvalidMoneyError('Minor amount must be a valid integer');
  }

  return Number((amountMinor / 100).toFixed(2));
}
