import type {ReactElement} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {Stack} from 'expo-router';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';

function CommunityHeaderTitle({children}: {children: string}): ReactElement {
  return (
    <View style={styles.titleContainer}>
      <Text style={styles.exampleBadge}>COMMUNITY EXAMPLE</Text>
      <Text style={styles.screenTitle} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

export default function RootLayout(): ReactElement {
  return (
    <ActionSheetProvider>
      <>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTitle: CommunityHeaderTitle,
            headerTintColor: '#0F766E',
            headerShadowVisible: false,
            headerStyle: {backgroundColor: '#F8FAFC'},
            contentStyle: {backgroundColor: '#F8FAFC'},
          }}
        >
          <Stack.Screen
            name="index"
            options={{title: 'Amazon Community Example'}}
          />
          <Stack.Screen
            name="community-package"
            options={{title: 'Use the community package'}}
          />
          <Stack.Screen
            name="provider-acceptance"
            options={{title: 'Provider Acceptance'}}
          />
          <Stack.Screen name="all-products" options={{title: 'All Products'}} />
          <Stack.Screen
            name="purchase-flow"
            options={{title: 'In-App Purchase Flow'}}
          />
          <Stack.Screen
            name="subscription-flow"
            options={{title: 'Subscription Flow'}}
          />
          <Stack.Screen
            name="available-purchases"
            options={{title: 'Available Purchases'}}
          />
          <Stack.Screen
            name="offer-code"
            options={{title: 'Offer Code Redemption'}}
          />
          <Stack.Screen
            name="alternative-billing"
            options={{title: 'Alternative Billing'}}
          />
        </Stack>
      </>
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  titleContainer: {gap: 2},
  exampleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    borderRadius: 4,
    color: '#115E59',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    lineHeight: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  screenTitle: {color: '#0F172A', fontSize: 17, fontWeight: '600'},
});
