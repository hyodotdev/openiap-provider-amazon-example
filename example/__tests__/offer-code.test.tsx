import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Platform, Alert} from 'react-native';
import OfferCode from '../app/offer-code';
import * as ExpoIap from 'expo-iap';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('expo-iap', () => ({
  openRedeemOfferCode: jest.fn(() =>
    Promise.resolve({
      id: 'redeemed-transaction',
      productId: 'premium',
      store: 'apple',
      storeId: 'apple',
    }),
  ),
  useIAP: jest.fn(() => ({
    connected: true,
  })),
}));

describe('OfferCode Component', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => originalPlatform),
      configurable: true,
    });
  });

  it('should render without crashing', async () => {
    const {getByText} = await render(<OfferCode />);
    expect(getByText('Offer Code Redemption')).toBeDefined();
  });

  it('should show iOS instructions on iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'ios'),
      configurable: true,
    });

    const {getByText} = await render(<OfferCode />);
    // Check for iOS-specific text from the actual component
    expect(
      getByText(/Tap the button below to open the redemption sheet/),
    ).toBeDefined();
    expect(
      getByText(/iOS supports in-app code redemption via StoreKit/),
    ).toBeDefined();
  });

  it('shows FireOS capability limits without launching another store', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: () => 'android',
      configurable: true,
    });
    const {getByText} = await render(<OfferCode />);
    expect(getByText(/Offer code redemption is unavailable/)).toBeDefined();
    await fireEvent.press(getByText('Amazon provider example'));
    expect(ExpoIap.openRedeemOfferCode).not.toHaveBeenCalled();
    expect(
      getByText(/Offer code redemption is not supported on amazon-example/),
    ).toBeDefined();
  });

  it('should show Vega unsupported guidance without calling platform redemption APIs', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'kepler'),
      configurable: true,
    });

    const {getByText} = await render(<OfferCode />);

    await fireEvent.press(getByText('Amazon provider example'));

    expect(ExpoIap.openRedeemOfferCode).not.toHaveBeenCalled();
    expect(
      getByText(/Offer code redemption is not supported on amazon-example/),
    ).toBeDefined();
  });

  it('should handle redeem button press on iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'ios'),
      configurable: true,
    });

    const {getByText} = await render(<OfferCode />);
    // The button text is "🎁 Redeem Offer Code" on iOS
    const redeemButton = getByText('🎁 Redeem Offer Code');

    await fireEvent.press(redeemButton);

    // Wait for async operation and Alert
    await waitFor(() => {
      expect(ExpoIap.openRedeemOfferCode).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Verified Redemption',
        'Redeemed premium (redeemed-transaction).',
      );
    });
  });

  it('should explain a nil iOS redemption result', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'ios'),
      configurable: true,
    });
    jest.mocked(ExpoIap.openRedeemOfferCode).mockResolvedValueOnce(null);

    const {getByText} = await render(<OfferCode />);
    await fireEvent.press(getByText('🎁 Redeem Offer Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Redemption Sheet Presented',
        'The system sheet did not return a transaction directly. Refresh available purchases after completing redemption.',
      );
    });
  });

  it('should surface launch failures as errors', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'ios'),
      configurable: true,
    });
    jest
      .mocked(ExpoIap.openRedeemOfferCode)
      .mockRejectedValueOnce(new Error('Unable to launch redeem page'));

    const {getByText} = await render(<OfferCode />);
    await fireEvent.press(getByText('🎁 Redeem Offer Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to redeem code: Unable to launch redeem page',
      );
    });
  });
});
