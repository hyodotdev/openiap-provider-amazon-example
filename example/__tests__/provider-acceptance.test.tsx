import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {useIAP, getAvailablePurchases} from 'expo-iap';
import type {Purchase, UseIAPOptions} from 'expo-iap';
import ProviderAcceptance from '../app/provider-acceptance';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
const hookDefaults = jest.mocked(useIAP)();
const purchase: Purchase = {
  id: 'test-receipt',
  purchaseToken: 'test-receipt',
  productId: 'dev.hyo.martie.10bulbs',
  store: 'unknown',
  storeId: 'amazon-example',
  purchaseState: 'purchased',
  transactionDate: 1,
  quantity: 1,
  isAutoRenewing: false,
};
const verified = {
  isValid: true,
  productId: purchase.productId,
  store: 'unknown',
  storeId: 'amazon-example',
  state: 'ready-to-consume',
  environment: 'Sandbox',
};
let options: UseIAPOptions | undefined;
const finish = jest.fn();
const verify = jest.fn();
const products: [] = [];

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_IAPKIT_API_KEY = 'openiap-kit_pk_test';
  process.env.EXPO_PUBLIC_IAPKIT_BASE_URL = 'http://127.0.0.1:3100';
  jest.mocked(useIAP).mockImplementation((value) => {
    options = value;
    return {
      ...hookDefaults,
      connected: true,
      products,
      fetchProducts: jest.fn(),
      finishTransaction: finish,
      verifyPurchaseWithProvider: verify,
    };
  });
  finish.mockResolvedValue(undefined);
  verify.mockResolvedValue({provider: 'iapkit', iapkit: verified});
  jest.mocked(getAvailablePurchases).mockResolvedValue([]);
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_IAPKIT_API_KEY;
  delete process.env.EXPO_PUBLIC_IAPKIT_BASE_URL;
});

it('preserves the callback receipt through restore, verification and completion', async () => {
  const view = await render(<ProviderAcceptance />);
  await act(async () => {
    options?.onPurchaseSuccess?.(purchase);
  });
  jest.mocked(getAvailablePurchases).mockResolvedValueOnce([purchase]);
  await fireEvent.press(view.getByText('Restore / owned'));
  await fireEvent.press(view.getByText('Verify & finish'));
  await waitFor(() =>
    expect(view.getByText(/Verified and finished/)).toBeDefined(),
  );
  expect(verify).toHaveBeenCalledWith(
    expect.objectContaining({
      iapkit: expect.objectContaining({
        amazon: {
          expectedProductId: purchase.productId,
          receiptId: purchase.purchaseToken,
          sandbox: true,
        },
      }),
    }),
  );
  expect(finish).toHaveBeenCalledWith({purchase, isConsumable: true});
});
it.each([
  {storeId: 'amazon'},
  {store: 'google'},
  {productId: 'wrong'},
  {environment: 'Production'},
  {state: 'pending'},
  {isValid: false},
])(
  'retains the receipt when verification does not satisfy acceptance',
  async (change) => {
    verify.mockResolvedValue({
      provider: 'iapkit',
      iapkit: {...verified, ...change},
    });
    const view = await render(<ProviderAcceptance />);
    await act(async () => {
      options?.onPurchaseSuccess?.(purchase);
    });
    await fireEvent.press(view.getByText('Verify & finish'));
    await waitFor(() =>
      expect(view.getByText(/Verification rejected/)).toBeDefined(),
    );
    expect(finish).not.toHaveBeenCalled();
  },
);
it('rejects a changed restored receipt and does not finish it', async () => {
  const view = await render(<ProviderAcceptance />);
  await act(async () => {
    options?.onPurchaseSuccess?.(purchase);
  });
  jest
    .mocked(getAvailablePurchases)
    .mockResolvedValueOnce([{...purchase, purchaseToken: 'changed'}]);
  await fireEvent.press(view.getByText('Restore / owned'));
  await waitFor(() =>
    expect(view.getByText('FAIL: restored receipt changed.')).toBeDefined(),
  );
  expect(finish).not.toHaveBeenCalled();
});
it('does not verify or finish pending approval', async () => {
  const view = await render(<ProviderAcceptance />);
  await act(async () => {
    options?.onPurchaseSuccess?.({...purchase, purchaseState: 'pending'});
  });
  await fireEvent.press(view.getByText('Verify & finish'));
  expect(view.getByText(/Pending approval/)).toBeDefined();
  expect(verify).not.toHaveBeenCalled();
  expect(finish).not.toHaveBeenCalled();
});
it('ignores callbacks for a different product', async () => {
  const view = await render(<ProviderAcceptance />);
  await act(async () => {
    options?.onPurchaseSuccess?.({...purchase, productId: 'different-sku'});
  });
  await fireEvent.press(view.getByText('Verify & finish'));
  expect(verify).not.toHaveBeenCalled();
  expect(finish).not.toHaveBeenCalled();
});
it('does not finish without a development publishable key', async () => {
  delete process.env.EXPO_PUBLIC_IAPKIT_API_KEY;
  const view = await render(<ProviderAcceptance />);
  await act(async () => {
    options?.onPurchaseSuccess?.(purchase);
  });
  await fireEvent.press(view.getByText('Verify & finish'));
  await waitFor(() =>
    expect(view.getByText(/Configure the local dev/)).toBeDefined(),
  );
  expect(finish).not.toHaveBeenCalled();
});
