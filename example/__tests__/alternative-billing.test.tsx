import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {Platform} from 'react-native';
import AlternativeBilling from '../app/alternative-billing';
import * as ExpoIap from 'expo-iap';

describe('AlternativeBilling Component', () => {
  const originalPlatform = Platform.OS;
  const mockFetchProducts = jest.fn(() => Promise.resolve([]));
  const mockFinishTransaction = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoIap.useIAP as jest.Mock).mockReturnValue({
      connected: true,
      products: [
        {
          id: 'dev.hyo.martie.consumable',
          title: 'Test Consumable',
          description: 'Test consumable description',
          displayPrice: '$0.99',
          type: 'in-app',
        },
      ],
      fetchProducts: mockFetchProducts,
      finishTransaction: mockFinishTransaction,
    });
  });

  it('retains a community callback without unverified completion', async () => {
    await render(<AlternativeBilling />);
    const options = jest.mocked(ExpoIap.useIAP).mock.calls[0][0];
    await act(async () => {
      await options?.onPurchaseSuccess?.({
        id: 'receipt-retained',
        purchaseToken: 'receipt-retained',
        productId: 'dev.hyo.martie.10bulbs',
        store: 'unknown',
        storeId: 'amazon-example',
        purchaseState: 'purchased',
        quantity: 1,
        isAutoRenewing: false,
        transactionDate: 1,
      });
    });
    expect(mockFinishTransaction).not.toHaveBeenCalled();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => originalPlatform),
      configurable: true,
    });
  });

  it('renders amazon-example as unsupported for alternative billing', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'android'),
      configurable: true,
    });

    const {getByText, queryByText} = await render(<AlternativeBilling />);

    expect(getByText('Not supported on amazon-example')).toBeDefined();
    expect(
      getByText(/Alternative billing APIs are intentionally unsupported/),
    ).toBeDefined();
    expect(
      getByText('Current mode: amazon-example standard IAP'),
    ).toBeDefined();

    expect(queryByText('Test Consumable')).toBeNull();
    expect(queryByText('Billing Flow')).toBeNull();
    expect(queryByText('Loading products...')).toBeNull();
  });
});
