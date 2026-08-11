import { describe, expect, test } from 'vitest';

import { InterfaceUpdateSchema } from '#db/repositories/interface/types';
import { HeaderProtectionKeySchema, RangeSchema } from '#server/utils/types';

// 32 bytes of base64, the size AmneziaWG expects for header protection
const VALID_KEY = 'lZQw527TZe9vnNKCS+lBu8tOBNxALjGyF7pZyqw7/MY=';

describe('HeaderProtectionKeySchema', () => {
  test('accepts a 32 byte base64 key', () => {
    expect(HeaderProtectionKeySchema.parse(VALID_KEY)).toBe(VALID_KEY);
  });

  test('accepts null, which keeps the interface on AmneziaWG 2.0', () => {
    expect(HeaderProtectionKeySchema.parse(null)).toBeNull();
  });

  test('trims surrounding whitespace', () => {
    expect(HeaderProtectionKeySchema.parse(`  ${VALID_KEY}\n`)).toBe(VALID_KEY);
  });

  test('rejects a key that decodes to fewer than 32 bytes', () => {
    // 16 bytes
    expect(() =>
      HeaderProtectionKeySchema.parse('AAAAAAAAAAAAAAAAAAAAAA==')
    ).toThrow();
  });

  test('rejects a key that is not base64', () => {
    expect(() =>
      HeaderProtectionKeySchema.parse(
        'not a base64 key at all!!!!!!!!!!!!!!!!!!'
      )
    ).toThrow();
  });

  test('rejects an unpadded key of the right length', () => {
    expect(() =>
      HeaderProtectionKeySchema.parse(VALID_KEY.slice(0, 43))
    ).toThrow();
  });
});

describe('RangeSchema', () => {
  test('accepts a single value', () => {
    expect(RangeSchema.parse('110')).toBe('110');
  });

  test('accepts a range', () => {
    expect(RangeSchema.parse('110-130')).toBe('110-130');
  });

  test('collapses a range whose bounds are equal', () => {
    expect(RangeSchema.parse('130-130')).toBe('130');
  });

  test('ignores whitespace', () => {
    expect(RangeSchema.parse(' 110 - 130 ')).toBe('110-130');
  });

  test('accepts the upper bound', () => {
    expect(RangeSchema.parse('65535')).toBe('65535');
  });

  test('rejects values above 65535, which AmneziaWG would silently truncate', () => {
    expect(() => RangeSchema.parse('65536')).toThrow();
    expect(() => RangeSchema.parse('1-65536')).toThrow();
  });

  test('rejects a reversed range', () => {
    expect(() => RangeSchema.parse('130-110')).toThrow();
  });

  test('rejects anything that is not a number or range', () => {
    expect(() => RangeSchema.parse('')).toThrow();
    expect(() => RangeSchema.parse('abc')).toThrow();
    expect(() => RangeSchema.parse('1-2-3')).toThrow();
  });

  test('accepts null', () => {
    expect(RangeSchema.parse(null)).toBeNull();
  });
});

const baseInterface = {
  ipv4Cidr: '10.8.0.0/24',
  ipv6Cidr: 'fdcc:ad94:bacf:61a4::cafe:0/112',
  mtu: 1420,
  routingTable: 'auto',
  jC: 4,
  jMin: 10,
  jMax: 50,
  s1: 15,
  s2: 15,
  s3: 15,
  s4: 15,
  h1: '1352562170',
  h2: '2017735697',
  h3: '2125253032',
  h4: '2138012066',
  i1: null,
  i2: null,
  i3: null,
  i4: null,
  i5: null,
  headerProtectionKey: null,
  contentPaddingAddition: null,
  rekeyAfterTime: null,
  rekeyTimeout: null,
  rejectAfterTime: null,
  keepaliveTimeout: null,
  maxHandshakeAttempts: null,
  port: 51820,
  device: 'eth0',
  enabled: true,
  firewallEnabled: false,
};

describe('InterfaceUpdateSchema with header protection', () => {
  test('accepts a header protection key when S1-S4 are large enough', () => {
    const result = InterfaceUpdateSchema.safeParse({
      ...baseInterface,
      headerProtectionKey: VALID_KEY,
      contentPaddingAddition: '0-8',
      rekeyAfterTime: '110-130',
    });

    expect(result.success).toBe(true);
  });

  test('rejects a header protection key when an S value is too small', () => {
    const result = InterfaceUpdateSchema.safeParse({
      ...baseInterface,
      s4: 8,
      headerProtectionKey: VALID_KEY,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain(
      's4'
    );
  });

  test('rejects a header protection key when an S value is unset', () => {
    const result = InterfaceUpdateSchema.safeParse({
      ...baseInterface,
      s3: null,
      headerProtectionKey: VALID_KEY,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain(
      's3'
    );
  });

  test('leaves 2.0 setups alone when no header protection key is set', () => {
    const result = InterfaceUpdateSchema.safeParse({
      ...baseInterface,
      s3: null,
      s4: null,
    });

    expect(result.success).toBe(true);
  });
});
