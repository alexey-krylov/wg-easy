import type { InferSelectModel } from 'drizzle-orm';
import z from 'zod';
import isCidr from 'is-cidr';

import type { wgInterface } from './schema';

import {
  EnabledSchema,
  HeaderProtectionKeySchema,
  HSchema,
  ISchema,
  JcSchema,
  JmaxSchema,
  JminSchema,
  MtuSchema,
  PortSchema,
  RangeSchema,
  RoutingTableSchema,
  S_MIN_HEADER_PROTECTION,
  SSchema,
  safeStringRefine,
  schemaForType,
  t,
} from '#server/utils/types';

export type InterfaceType = InferSelectModel<typeof wgInterface>;

export type InterfaceCreateType = Omit<
  InterfaceType,
  'createdAt' | 'updatedAt'
>;

export type InterfaceUpdateType = Omit<
  InterfaceCreateType,
  'name' | 'createdAt' | 'updatedAt' | 'privateKey' | 'publicKey'
>;

const device = z
  .string({ message: t('zod.interface.device') })
  .min(1, t('zod.interface.device'))
  .pipe(safeStringRefine);

const cidr = z
  .string({ message: t('zod.interface.cidr') })
  .min(1, { message: t('zod.interface.cidr') })
  .refine((value) => isCidr(value), { message: t('zod.interface.cidrValid') })
  .pipe(safeStringRefine);

export const InterfaceUpdateSchema = schemaForType<InterfaceUpdateType>()(
  z.object({
    ipv4Cidr: cidr,
    ipv6Cidr: cidr,
    mtu: MtuSchema,
    routingTable: RoutingTableSchema,
    jC: JcSchema,
    jMin: JminSchema,
    jMax: JmaxSchema,
    s1: SSchema,
    s2: SSchema,
    s3: SSchema,
    s4: SSchema,
    h1: HSchema,
    h2: HSchema,
    h3: HSchema,
    h4: HSchema,
    i1: ISchema,
    i2: ISchema,
    i3: ISchema,
    i4: ISchema,
    i5: ISchema,
    headerProtectionKey: HeaderProtectionKeySchema,
    contentPaddingAddition: RangeSchema,
    rekeyAfterTime: RangeSchema,
    rekeyTimeout: RangeSchema,
    rejectAfterTime: RangeSchema,
    keepaliveTimeout: RangeSchema,
    maxHandshakeAttempts: RangeSchema,
    randomTrailers: EnabledSchema,
    disableCookies: EnabledSchema,
    port: PortSchema,
    device: device,
    enabled: EnabledSchema,
    firewallEnabled: EnabledSchema,
  })
).superRefine((data, ctx) => {
  if (!data.headerProtectionKey) {
    return;
  }

  // With header protection enabled the first 12 bytes of the junk are used as
  // the ChaCha20 nonce, so every junk size has to provide at least that many
  // bytes. AmneziaWG rejects the interface with EINVAL otherwise, which
  // surfaces as an unhelpful "Unable to modify interface: Invalid argument".
  for (const field of ['s1', 's2', 's3', 's4'] as const) {
    const value = data[field];

    if (
      value === null ||
      value === undefined ||
      value < S_MIN_HEADER_PROTECTION
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: t('zod.interface.sHeaderProtection'),
      });
    }
  }
});

export type InterfaceCidrUpdateType = {
  ipv4Cidr: string;
  ipv6Cidr: string;
};

export const InterfaceCidrUpdateSchema =
  schemaForType<InterfaceCidrUpdateType>()(
    z.object({
      ipv4Cidr: cidr,
      ipv6Cidr: cidr,
    })
  );
