jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        amazonRvsSandbox: 'true',
        iapkitApiKey: 'test-api-key',
        iapkitBaseUrl: 'http://localhost:3100',
      },
    },
  },
}));

import {
  createIapkitVerificationPayload,
  getDefaultVerificationMethod,
  getDirectVerificationError,
  getIapkitVerificationError,
  rememberCompletedPurchaseKey,
  resolveIapkitVerificationBaseUrl,
} from '../src/utils/vegaRuntime';
import type {Purchase, RequestVerifyPurchaseWithIapkitResult} from 'expo-iap';
import Constants from 'expo-constants';

describe('Vega runtime example helpers', () => {
  it('uses configured IAPKit credentials for Amazon purchases', () => {
    const payload = createIapkitVerificationPayload(
      {
        id: 'receipt-1',
        productId: 'dev.hyo.martie.10bulbs',
        purchaseToken: 'receipt-1',
        store: 'amazon',
        storeId: 'amazon',
      } as Purchase,
      'receipt-1',
      'http://localhost:3100',
    );

    expect(payload).toMatchObject({
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:3100',
      amazon: {
        expectedProductId: 'dev.hyo.martie.10bulbs',
        receiptId: 'receipt-1',
        sandbox: true,
      },
    });
  });

  it('uses configured IAPKit credentials for non-Amazon purchases', () => {
    const payload = createIapkitVerificationPayload(
      {
        id: 'token-1',
        productId: 'dev.hyo.martie.10bulbs',
        purchaseToken: 'token-1',
        store: 'google',
        storeId: 'play',
      } as Purchase,
      'token-1',
      'http://localhost:3100',
    );

    expect(payload).toMatchObject({
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:3100',
      google: {
        purchaseToken: 'token-1',
      },
    });
  });

  it('uses Horizon verification without treating the purchase ID as a user ID', () => {
    const payload = createIapkitVerificationPayload(
      {
        id: 'purchase-id-1',
        productId: 'dev.hyo.martie.premium',
        purchaseToken: 'purchase-id-1',
        store: 'horizon',
        storeId: 'horizon',
      } as Purchase,
      'purchase-id-1',
      'http://localhost:3100',
    );

    expect(payload).toMatchObject({
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:3100',
      horizon: {sku: 'dev.hyo.martie.premium'},
    });
    expect(payload).not.toHaveProperty('google');
  });

  it('defaults to local IAPKit when a key and local URL are configured', () => {
    expect(getDefaultVerificationMethod()).toBe('iapkit-localhost');
  });

  it('defaults to hosted IAPKit when only an API key is configured', () => {
    expect(getDefaultVerificationMethod('test-api-key', '')).toBe('iapkit');
  });

  it('fails closed through local verification without an API key', () => {
    expect(getDefaultVerificationMethod('', 'http://localhost:3100')).toBe(
      'iapkit-localhost',
    );
  });

  it('omits the configured local URL for hosted IAPKit', () => {
    const baseUrl = resolveIapkitVerificationBaseUrl(
      'iapkit',
      'http://localhost:3100',
    );
    const payload = createIapkitVerificationPayload(
      {
        id: 'token-1',
        productId: 'dev.hyo.martie.10bulbs',
        purchaseToken: 'token-1',
        store: 'google',
        storeId: 'play',
      } as Purchase,
      'token-1',
      baseUrl,
    );

    expect(payload).not.toHaveProperty('baseUrl');
  });

  it('requires an explicit base URL for local IAPKit', () => {
    expect(() =>
      resolveIapkitVerificationBaseUrl('iapkit-localhost', '  '),
    ).toThrow(
      'EXPO_PUBLIC_IAPKIT_BASE_URL not configured for Local (IAPKit) verification',
    );
  });

  it('accepts a valid Amazon Sandbox consumable for the expected product', () => {
    expect(
      getIapkitVerificationError(
        {
          provider: 'iapkit',
          iapkit: {
            environment: 'Sandbox',
            isValid: true,
            productId: 'dev.hyo.martie.10bulbs',
            state: 'ready-to-consume',
            store: 'amazon',
            storeId: 'amazon',
          },
        },
        'dev.hyo.martie.10bulbs',
        true,
      ),
    ).toBeNull();
  });

  it('rejects Amazon verification without a product ID', () => {
    expect(
      getIapkitVerificationError(
        {
          provider: 'iapkit',
          iapkit: {
            environment: 'Sandbox',
            isValid: true,
            state: 'ready-to-consume',
            store: 'amazon',
            storeId: 'amazon',
          },
        },
        'dev.hyo.martie.10bulbs',
        true,
      ),
    ).toBe('IAPKit did not return a product ID for amazon');
  });

  it('rejects the wrong Amazon environment', () => {
    expect(
      getIapkitVerificationError(
        {
          provider: 'iapkit',
          iapkit: {
            environment: 'Production',
            isValid: true,
            productId: 'dev.hyo.martie.10bulbs',
            state: 'ready-to-consume',
            store: 'amazon',
            storeId: 'amazon',
          },
        },
        'dev.hyo.martie.10bulbs',
        true,
      ),
    ).toContain('expected Sandbox');
  });

  it('accepts ready-to-consume only for Google consumables', () => {
    expect(
      getIapkitVerificationError(
        {
          provider: 'iapkit',
          iapkit: {
            isValid: true,
            productId: 'dev.hyo.martie.10bulbs',
            state: 'ready-to-consume',
            store: 'google',
            storeId: 'play',
          },
        },
        'dev.hyo.martie.10bulbs',
        true,
      ),
    ).toBeNull();

    expect(
      getIapkitVerificationError(
        {
          provider: 'iapkit',
          iapkit: {
            isValid: true,
            productId: 'dev.hyo.martie.10bulbs',
            state: 'ready-to-consume',
            store: 'google',
            storeId: 'play',
          },
        },
        'dev.hyo.martie.10bulbs',
        false,
      ),
    ).toContain('cannot fulfill this non-consumable google purchase');

    for (const state of ['entitled', 'pending-acknowledgment'] as const) {
      expect(
        getIapkitVerificationError(
          {
            provider: 'iapkit',
            iapkit: {
              isValid: true,
              productId: 'dev.hyo.martie.10bulbs',
              state,
              store: 'google',
              storeId: 'play',
            },
          },
          'dev.hyo.martie.10bulbs',
          true,
        ),
      ).toBeNull();
    }
  });

  it('keeps the completed purchase cache bounded and refreshes recency', () => {
    const completedKeys = new Set(['oldest', 'middle']);

    rememberCompletedPurchaseKey(completedKeys, 'oldest', 2);
    rememberCompletedPurchaseKey(completedKeys, 'newest', 2);

    expect([...completedKeys]).toEqual(['oldest', 'newest']);
  });

  it('rejects explicit invalid direct-store results', () => {
    expect(
      getDirectVerificationError({
        isValid: false,
        jwsRepresentation: '',
        receiptData: '',
      }),
    ).toContain('invalid receipt');
    expect(
      getDirectVerificationError({isValid: true, success: false}),
    ).toContain('rejected the entitlement');
  });
});

describe('community Amazon verification boundary', () => {
  const purchase = {
    id: 'receipt-example',
    productId: 'dev.hyo.martie.10bulbs',
    purchaseToken: 'receipt-example',
    store: 'unknown',
    storeId: 'amazon-example',
    purchaseState: 'purchased',
    transactionDate: 1,
    quantity: 1,
    isAutoRenewing: false,
  } satisfies Purchase;
  const result = {
    provider: 'iapkit' as const,
    iapkit: {
      isValid: true,
      productId: purchase.productId,
      environment: 'Sandbox',
      state: 'ready-to-consume' as const,
      store: 'unknown' as const,
      storeId: 'amazon-example',
    },
  };
  it('routes the unchanged custom receipt explicitly to Amazon', () => {
    const payload = createIapkitVerificationPayload(
      purchase,
      purchase.purchaseToken,
    );
    expect(payload.amazon).toEqual({
      expectedProductId: purchase.productId,
      receiptId: purchase.purchaseToken,
      sandbox: true,
    });
    expect(payload.google).toBeUndefined();
    expect(
      getIapkitVerificationError(
        result,
        purchase.productId,
        true,
        purchase.storeId,
      ),
    ).toBeNull();
  });
  it('rejects another unknown provider instead of routing it to Play', () => {
    expect(() =>
      createIapkitVerificationPayload(
        {...purchase, storeId: 'other-example'},
        purchase.purchaseToken,
      ),
    ).toThrow('No verification adapter');
  });
  it('keeps LAT verification on production RVS and rejects sandbox receipts', () => {
    const extra = Constants.expoConfig?.extra;
    if (!extra) throw new Error('Missing test configuration');
    const originalSandbox = extra.amazonRvsSandbox;
    extra.amazonRvsSandbox = 'false';
    try {
      expect(
        createIapkitVerificationPayload(purchase, purchase.purchaseToken).amazon,
      ).toMatchObject({sandbox: false});
      expect(
        getIapkitVerificationError(
          {...result, iapkit: {...result.iapkit, environment: 'Production'}},
          purchase.productId,
          true,
          purchase.storeId,
        ),
      ).toBeNull();
      expect(
        getIapkitVerificationError(
          result,
          purchase.productId,
          true,
          purchase.storeId,
        ),
      ).toContain('expected Production');
    } finally {
      extra.amazonRvsSandbox = originalSandbox;
    }
  });
  it.each(['dev.hyo.martie.premium', 'dev.hyo.martie.premium_year'])(
    'verifies a new subscription term against its configured RVS base: %s',
    (productId) => {
      const subscription = {...purchase, productId};
      const payload = createIapkitVerificationPayload(
        subscription,
        subscription.purchaseToken,
      );
      expect(payload.amazon).toEqual({
        expectedProductId: 'dev.hyo.martie.premium.base',
        receiptId: subscription.purchaseToken,
        sandbox: true,
      });
      const verified = {
        ...result,
        iapkit: {
          ...result.iapkit,
          productId: 'dev.hyo.martie.premium.base',
          state: 'entitled' as const,
        },
      };
      expect(
        getIapkitVerificationError(
          verified,
          productId,
          false,
          purchase.storeId,
        ),
      ).toBeNull();
      expect(
        getIapkitVerificationError(
          {
            ...verified,
            iapkit: {...verified.iapkit, productId: 'unrelated.base'},
          },
          productId,
          false,
          purchase.storeId,
        ),
      ).toContain('expected dev.hyo.martie.premium.base');
    },
  );
  it.each<[Partial<RequestVerifyPurchaseWithIapkitResult>, string]>([
    [{storeId: 'amazon'}, 'changed provider identity'],
    [{store: 'google'}, 'changed community store'],
    [{productId: 'different'}, 'expected'],
    [{environment: 'Production'}, 'expected Sandbox'],
    [{state: 'pending'}, 'cannot fulfill'],
    [{isValid: false}, 'rejected'],
  ])(
    'keeps receipts unfinished for a rejected verification',
    (change, message) => {
      const changed = {...result, iapkit: {...result.iapkit, ...change}};
      expect(
        getIapkitVerificationError(
          changed,
          purchase.productId,
          true,
          purchase.storeId,
        ),
      ).toContain(message);
    },
  );
});
