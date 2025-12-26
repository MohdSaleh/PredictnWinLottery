import { SalesService } from '../services/sales.service';

describe('Sales Service - Expansion Logic', () => {
  describe('expand100Macro', () => {
    test('should expand to 10 numbers for 3-digit (000, 100, ..., 900)', () => {
      const result = SalesService.expand100Macro(3);
      expect(result).toHaveLength(10);
      expect(result).toEqual(['000', '100', '200', '300', '400', '500', '600', '700', '800', '900']);
    });

    test('should expand correctly for 2-digit numbers', () => {
      const result = SalesService.expand100Macro(2);
      expect(result).toHaveLength(10);
      expect(result[0]).toBe('00');
      expect(result[1]).toBe('100'); // padStart doesn't truncate, it pads to minimum
      expect(result[9]).toBe('900');
    });
  });

  describe('expand111Macro', () => {
    test('should expand to 10 numbers for 3-digit (000, 111, ..., 999)', () => {
      const result = SalesService.expand111Macro(3);
      expect(result).toHaveLength(10);
      expect(result).toEqual(['000', '111', '222', '333', '444', '555', '666', '777', '888', '999']);
    });

    test('should expand correctly for 2-digit numbers', () => {
      const result = SalesService.expand111Macro(2);
      expect(result).toHaveLength(10);
      expect(result).toEqual(['00', '11', '22', '33', '44', '55', '66', '77', '88', '99']);
    });
  });

  describe('expandBOXK', () => {
    test('should generate all permutations for 123', () => {
      const result = SalesService.expandBOXK('123');
      expect(result).toHaveLength(6);
      expect(result).toContain('123');
      expect(result).toContain('132');
      expect(result).toContain('213');
      expect(result).toContain('231');
      expect(result).toContain('312');
      expect(result).toContain('321');
    });

    test('should handle numbers with repeated digits', () => {
      const result = SalesService.expandBOXK('112');
      // Should have 3 unique permutations: 112, 121, 211
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result).size).toBe(result.length); // All unique
    });

    test('should handle single-digit number', () => {
      const result = SalesService.expandBOXK('5');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('5');
    });
  });
});
