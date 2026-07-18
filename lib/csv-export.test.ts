import { describe, expect, it } from 'vitest';

import {
  TRANSACTIONS_CSV_HEADER,
  buildTransactionsCsv,
  escapeCsvField,
  formatAmountForCsv,
} from './csv-export';

describe('escapeCsvField — formula-injection guard', () => {
  it.each([
    ['=SUM(A1:A9)', "'=SUM(A1:A9)"],
    ['+1234', "'+1234"],
    ['-cmd', "'-cmd"],
    ['@import', "'@import"],
    ['\ttabbed', "'\ttabbed"],
  ])('prefixes %j with an apostrophe', (input, expected) => {
    expect(escapeCsvField(input)).toBe(expected);
  });

  it('prefixes a leading carriage return and then quotes it', () => {
    expect(escapeCsvField('\rreturn')).toBe('"\'\rreturn"');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeCsvField('Trader Joes')).toBe('Trader Joes');
    expect(escapeCsvField('cafe = good')).toBe('cafe = good');
    expect(escapeCsvField('')).toBe('');
  });
});

describe('escapeCsvField — RFC 4180', () => {
  it('quotes fields containing commas', () => {
    expect(escapeCsvField('Smith, John')).toBe('"Smith, John"');
  });

  it('doubles embedded quotes', () => {
    expect(escapeCsvField('the "best" cafe')).toBe('"the ""best"" cafe"');
  });

  it('quotes fields containing newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('quotes an injected field that also contains a comma', () => {
    expect(escapeCsvField('=HYPERLINK("http://evil",“x”),extra')).toBe(
      '"\'=HYPERLINK(""http://evil"",“x”),extra"',
    );
  });
});

describe('formatAmountForCsv', () => {
  it('formats negative expenses with three exact decimals', () => {
    expect(formatAmountForCsv(-15990)).toBe('-15.990');
  });

  it('formats income and sub-dollar values', () => {
    expect(formatAmountForCsv(1234567)).toBe('1234.567');
    expect(formatAmountForCsv(50)).toBe('0.050');
    expect(formatAmountForCsv(-1)).toBe('-0.001');
    expect(formatAmountForCsv(0)).toBe('0.000');
  });

  it('stays exact beyond 32-bit range', () => {
    expect(formatAmountForCsv(9_007_199_254_740)).toBe('9007199254.740');
  });

  it('round-trips through the import conversion', () => {
    for (const milliunits of [-15990, 50, -1, 123456789, 0]) {
      const parsed = Math.round(parseFloat(formatAmountForCsv(milliunits)) * 1000);
      expect(parsed).toBe(milliunits);
    }
  });
});

describe('buildTransactionsCsv', () => {
  it('assembles header, escaped fields, and CRLF endings', () => {
    const csv = buildTransactionsCsv([
      {
        date: new Date(2026, 5, 15),
        payee: '=HYPERLINK("http://evil.example/x")',
        amount: -15990,
        category: 'Subscriptions',
        account: 'Checking',
        notes: null,
      },
      {
        date: new Date(2026, 5, 14),
        payee: 'Smith, John',
        amount: 250000,
        category: null,
        account: 'Savings',
        notes: 'transfer "gift"',
      },
    ]);

    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(TRANSACTIONS_CSV_HEADER);
    expect(lines[1]).toBe(
      '2026-06-15,"\'=HYPERLINK(""http://evil.example/x"")",-15.990,Subscriptions,Checking,',
    );
    expect(lines[2]).toBe('2026-06-14,"Smith, John",250.000,,Savings,"transfer ""gift"""');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('produces only the header for an empty set', () => {
    expect(buildTransactionsCsv([])).toBe(`${TRANSACTIONS_CSV_HEADER}\r\n`);
  });
});
