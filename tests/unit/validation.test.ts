import { test, expect } from '@playwright/test';
import { validateName, normalizePhone, formatPhone, validatePhone } from '@/lib/validation';

test.describe('validateName', () => {
  for (const name of ['José Álvarez', 'Zoë Kravitz', 'Nguyễn Văn An', 'Łukasz Müller', 'Søren', '李小龍']) {
    test(`accepts the international name ${name}`, () => {
      expect(validateName(name)).toBe('');
    });
  }

  test('accepts names typed with combining accents (decomposed form)', () => {
    expect(validateName('Nguyễn Văn An'.normalize('NFD'))).toBe('');
    expect(validateName('José Álvarez'.normalize('NFD'))).toBe('');
  });

  test('accepts ASCII and typographic apostrophes, hyphens and periods', () => {
    expect(validateName("O'Brien")).toBe('');
    expect(validateName('O’Brien')).toBe('');
    expect(validateName('Mary-Jane Watson-Parker')).toBe('');
    expect(validateName('Martin Luther King Jr.')).toBe('');
  });

  test('keeps rejecting digits, emoji and markup', () => {
    for (const bad of ['John 3rd', 'Zoë 😀', '<script>', 'Ann<script>alert(1)</script>']) {
      expect(validateName(bad), bad).toBe("Letters, spaces, . - ' only");
    }
  });

  test('keeps rejecting names that start with punctuation or a combining mark', () => {
    for (const bad of ["'Brien", '’Brien', '-Anna', '.Ann', '\u0301Ann']) {
      expect(validateName(bad), bad).toBe("Letters, spaces, . - ' only");
    }
  });

  test('keeps the required and 2–60 length rules', () => {
    expect(validateName('   ')).toBe('Full name is required');
    expect(validateName('A')).toBe('At least 2 characters');
    expect(validateName('A'.repeat(60))).toBe('');
    expect(validateName('A'.repeat(61))).toBe('Name is too long');
  });
});

test.describe('normalizePhone', () => {
  test('drops a leading +1 country code from an 11-digit US number', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('5551234567');
  });

  test('strips formatting from a 10-digit number', () => {
    expect(normalizePhone('555-123-4567')).toBe('5551234567');
  });

  test('keeps a leading 1 until the number reaches 11 digits', () => {
    expect(normalizePhone('1')).toBe('1');
    expect(normalizePhone('1555123456')).toBe('1555123456');
  });

  test('keeps at most 10 digits', () => {
    expect(normalizePhone('555-123-45678')).toBe('5551234567');
  });

  test('a pasted +1 number formats and validates as the 10-digit number', () => {
    expect(formatPhone('+1 (555) 123-4567')).toBe('(555) 123-4567');
    expect(validatePhone('+1 (555) 123-4567')).toBe('');
  });
});
