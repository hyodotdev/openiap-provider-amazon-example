import React from 'react';
import {Dimensions} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import ProviderTutorial from '../src/components/ProviderTutorial';

describe('Provider tutorial layouts', () => {
  const originalWindow = Dimensions.get('window');
  const originalScreen = Dimensions.get('screen');
  afterEach(() =>
    Dimensions.set({window: originalWindow, screen: originalScreen}),
  );

  it('opens and closes the selected layer as a compact guide', async () => {
    const size = {width: 390, height: 844, scale: 1, fontScale: 1};
    Dimensions.set({window: size, screen: size});
    const {getByRole, getByText, queryByText} = await render(
      <ProviderTutorial />,
    );
    expect(queryByText('Prove the vendor binding.')).toBeNull();
    await fireEvent.press(
      getByRole('button', {name: 'Learn about Amazon SDK'}),
    );
    expect(getByText('Prove the vendor binding.')).toBeDefined();
    expect(getByText(/Live App Testing is separate/)).toBeDefined();
    await fireEvent.press(
      getByRole('button', {name: 'Close integration guide'}),
    );
    expect(queryByText('Prove the vendor binding.')).toBeNull();
  });

  it('updates the side explanation on wide displays without a modal', async () => {
    const size = {width: 1024, height: 768, scale: 1, fontScale: 1};
    Dimensions.set({window: size, screen: size});
    const {getByRole, getByText, queryByText} = await render(
      <ProviderTutorial />,
    );
    expect(getByText('Keep the public purchase API.')).toBeDefined();
    await fireEvent.press(
      getByRole('button', {name: 'Learn about Public core'}),
    );
    expect(getByText('Use the extension boundary.')).toBeDefined();
    expect(queryByText('Keep the public purchase API.')).toBeNull();
    expect(queryByText('Integration guide')).toBeNull();
  });
});
