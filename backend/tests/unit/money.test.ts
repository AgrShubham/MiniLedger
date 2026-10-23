import { toMinor, toMajor, InvalidMoneyError } from '../../src/lib/money';

describe('Money utility functions', () => {
  describe('toMinor', () => {
    it('converts standard decimal amount to minor units integer', () => {
      expect(toMinor(12.34)).toBe(1234);
      expect(toMinor(1500.5)).toBe(150050);
      expect(toMinor(100)).toBe(10000);
      expect(toMinor(0)).toBe(0);
      expect(toMinor(0.05)).toBe(5);
    });

    it('handles floating point arithmetic edge cases cleanly', () => {
      // 1.05 * 100 in JS can equal 105.00000000000001
      expect(toMinor(1.05)).toBe(105);
      expect(toMinor(19.99)).toBe(1999);
    });

    it('throws InvalidMoneyError for negative amounts', () => {
      expect(() => toMinor(-10)).toThrow(InvalidMoneyError);
      expect(() => toMinor(-0.01)).toThrow('Amount cannot be negative');
    });

    it('throws InvalidMoneyError for more than 2 decimal places', () => {
      expect(() => toMinor(10.123)).toThrow(InvalidMoneyError);
      expect(() => toMinor(10.123)).toThrow('Amount cannot have more than 2 decimal places');
    });

    it('throws InvalidMoneyError for NaN or non-finite values', () => {
      expect(() => toMinor(NaN)).toThrow(InvalidMoneyError);
      expect(() => toMinor(Infinity)).toThrow(InvalidMoneyError);
    });
  });

  describe('toMajor', () => {
    it('converts minor units integer back to standard decimal number', () => {
      expect(toMajor(1234)).toBe(12.34);
      expect(toMajor(150050)).toBe(1500.5);
      expect(toMajor(10000)).toBe(100);
      expect(toMajor(0)).toBe(0);
      expect(toMajor(5)).toBe(0.05);
    });

    it('throws InvalidMoneyError for invalid minor values', () => {
      expect(() => toMajor(NaN)).toThrow(InvalidMoneyError);
      expect(() => toMajor(Infinity)).toThrow(InvalidMoneyError);
    });
  });
});
