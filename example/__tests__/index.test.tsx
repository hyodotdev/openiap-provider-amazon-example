import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {Platform} from 'react-native';
import Home from '../app/index';
import * as ExpoIap from 'expo-iap';
import {isAmazonRvsSandboxEnabled} from '../src/utils/vegaRuntime';

jest.mock('expo-router', () => ({
  Link: ({children}: {children: React.ReactNode}) => children,
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('expo-iap', () => ({
  getStorefront: jest.fn(() => Promise.resolve('US')),
}));

jest.mock('../src/utils/vegaRuntime', () => ({
  isAmazonRvsSandboxEnabled: jest.fn(() => true),
}));

describe('Home Component', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAmazonRvsSandboxEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => originalPlatform),
      configurable: true,
    });
  });

  it('should render without crashing', async () => {
    const {getByText} = await render(<Home />);
    expect(getByText('Amazon Community Example')).toBeDefined();

    await waitFor(() => {
      expect(ExpoIap.getStorefront).toHaveBeenCalled();
    });
  });

  it('should render the full example menu', async () => {
    const {getByText} = await render(<Home />);

    expect(getByText('All Products')).toBeDefined();
    expect(getByText('In-App Purchase Flow')).toBeDefined();
    expect(getByText('Subscription Flow')).toBeDefined();
    expect(getByText('Available Purchases')).toBeDefined();
    expect(getByText('Offer Code Redemption')).toBeDefined();
    expect(getByText('Alternative Billing')).toBeDefined();

    await waitFor(() => {
      expect(ExpoIap.getStorefront).toHaveBeenCalled();
    });
  });

  it('identifies production RVS without claiming an App Tester run', async () => {
    jest.mocked(isAmazonRvsSandboxEnabled).mockReturnValue(false);

    const {getByText, queryByText} = await render(<Home />);

    expect(getByText('amazon-example · Production RVS')).toBeDefined();
    expect(getByText(/requires an Appstore test build/)).toBeDefined();
    expect(queryByText(/Purchases are simulated/)).toBeNull();
    await waitFor(() => {
      expect(ExpoIap.getStorefront).toHaveBeenCalled();
    });
  });

  it('should render on iOS platform', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'ios'),
      configurable: true,
    });

    const {getByText} = await render(<Home />);
    expect(getByText('Amazon Community Example')).toBeDefined();

    await waitFor(() => {
      expect(ExpoIap.getStorefront).toHaveBeenCalled();
    });
  });

  it('should render on Android platform', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'android'),
      configurable: true,
    });

    const consoleLog = jest.spyOn(console, 'log').mockImplementation();

    const {getByText} = await render(<Home />);
    expect(getByText('Amazon Community Example')).toBeDefined();

    await waitFor(() => {
      expect(ExpoIap.getStorefront).toHaveBeenCalled();
    });

    consoleLog.mockRestore();
  });

  it('should skip storefront lookup on Vega', async () => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => 'kepler'),
      configurable: true,
    });

    const {getByText} = await render(<Home />);
    expect(getByText('Amazon Community Example')).toBeDefined();
    expect(ExpoIap.getStorefront).not.toHaveBeenCalled();
  });
});
