import {useEffect, useRef, useState} from 'react';
import {ScrollView, Text, Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  useIAP,
  requestPurchase,
  getStorefront,
  getAvailablePurchases,
  type Purchase,
} from 'expo-iap';

import ProviderTutorial from '../src/components/ProviderTutorial';

const SKU = 'dev.hyo.martie.10bulbs';
export default function App() {
  const [status, setStatus] = useState(
    'Connect to Amazon App Tester to load the catalog.',
  );
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState({
    catalog: false,
    identity: false,
    continuity: false,
    verified: false,
    finished: false,
  });
  const [failed, setFailed] = useState(false);
  const actionRunning = useRef(false);
  const {
    connected,
    products,
    fetchProducts,
    finishTransaction,
    verifyPurchaseWithProvider,
  } = useIAP({
    onPurchaseSuccess: (value) => {
      if (value.productId !== SKU) return;
      if (value.storeId !== 'amazon-example' || value.store !== 'unknown') {
        setStatus('FAIL: purchase identity did not reach the public SDK.');
        setFailed(true);
        setPurchase(null);
        return;
      }
      if (value.purchaseState !== 'purchased') {
        setStatus('Pending approval · no entitlement or completion.');
        return;
      }
      setChecks((current) => ({...current, identity: true}));
      setPurchase(value);
      setStatus(
        `Purchase received · ${value.storeId} · ${value.purchaseState}`,
      );
    },
    onPurchaseError: (error) => {
      setStatus(`Purchase error: ${error.code} · no entitlement granted.`);
      setFailed(true);
    },
  });
  useEffect(() => {
    setChecks((current) => ({
      ...current,
      catalog: products.some((product) => product.id === SKU),
    }));
  }, [products]);
  async function run(action: () => Promise<void>) {
    if (actionRunning.current) return;
    actionRunning.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await action();
    } catch (error) {
      setFailed(true);
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      actionRunning.current = false;
      setBusy(false);
    }
  }
  async function verifyAndFinish() {
    if (!purchase?.purchaseToken || purchase.purchaseState !== 'purchased')
      throw new Error('A completed checkout is required before verification.');
    const apiKey = process.env.EXPO_PUBLIC_IAPKIT_API_KEY;
    const baseUrl = process.env.EXPO_PUBLIC_IAPKIT_BASE_URL;
    if (
      !apiKey?.startsWith('openiap-kit_pk_') ||
      !baseUrl?.startsWith('http://127.0.0.1:')
    ) {
      throw new Error(
        'Configure the local dev IAPKit URL and publishable key.',
      );
    }
    const result = await verifyPurchaseWithProvider({
      provider: 'iapkit',
      iapkit: {
        apiKey,
        baseUrl,
        amazon: {
          expectedProductId: purchase.productId,
          receiptId: purchase.purchaseToken,
          sandbox: true,
        },
      },
    });
    const verified = result.iapkit;
    if (
      !verified?.isValid ||
      verified.storeId !== 'amazon-example' ||
      verified.store !== 'unknown' ||
      verified.productId !== purchase.productId ||
      verified.environment !== 'Sandbox' ||
      verified.state !== 'ready-to-consume'
    ) {
      throw new Error(
        `Verification rejected: ${verified?.state ?? 'no result'}`,
      );
    }
    setChecks((current) => ({...current, verified: true}));
    await finishTransaction({purchase, isConsumable: true});
    const owned = await getAvailablePurchases();
    if (owned.some((value) => value.purchaseToken === purchase.purchaseToken)) {
      throw new Error(
        'Completion returned, but the consumable is still owned. Restore and retry.',
      );
    }
    setChecks((current) => ({...current, finished: true}));
    setStatus(
      `Verified and finished · ${verified.storeId} · ${verified.state} · ${verified.environment}`,
    );
    setPurchase(null);
  }
  const actions = [
    {
      label: 'Load products',
      action: async () => {
        await fetchProducts({skus: [SKU], type: 'in-app'});
        const storefront = await getStorefront();
        setStatus(`Catalog loaded · storefront ${storefront}`);
      },
    },
    {
      label: 'Purchase',
      needsEmptyPurchase: true,
      action: async () => {
        setChecks((current) => ({
          ...current,
          identity: false,
          continuity: false,
          verified: false,
          finished: false,
        }));
        await requestPurchase({
          request: {google: {skus: [SKU]}},
          type: 'in-app',
        });
      },
    },
    {
      label: 'Restore / owned',
      action: async () => {
        const owned = await getAvailablePurchases();
        if (
          owned.some(
            (value) =>
              value.storeId !== 'amazon-example' || value.store !== 'unknown',
          )
        )
          throw new Error('FAIL: restored identity changed.');
        const current = owned.find((value) => value.productId === SKU);
        if (
          current &&
          purchase &&
          current.purchaseToken !== purchase.purchaseToken
        )
          throw new Error('FAIL: restored receipt changed.');
        if (current && current.purchaseState !== 'purchased') {
          setPurchase(null);
          setStatus('Pending approval · no entitlement or completion.');
          return;
        }
        if (current && purchase)
          setChecks((value) => ({...value, continuity: true}));
        setPurchase(current ?? null);
        setStatus(`Owned purchases: ${owned.length} · amazon-example`);
      },
    },
    {label: 'Verify & finish', action: verifyAndFinish, needsPurchase: true},
  ];
  const progress = [
    {label: 'Connection', complete: connected},
    {label: 'Catalog', complete: checks.catalog},
    {label: 'Provider identity', complete: checks.identity},
    {label: 'Receipt continuity', complete: checks.continuity},
    {label: 'Sandbox verification', complete: checks.verified},
    {label: 'Completion', complete: checks.finished},
  ];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PUBLIC SDK · EXTERNAL PROVIDER</Text>
            <Text style={styles.title}>Prove the integration.</Text>
            <Text style={styles.description}>
              The same purchase API, backed by your independently packaged
              Amazon SDK binding.
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                amazon-example · Client Protocol 0.2.0
              </Text>
            </View>
          </View>
          <ProviderTutorial />
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Integration checks</Text>
            <View style={styles.checkGrid}>
              {progress.map((check) => (
                <View key={check.label} style={styles.check}>
                  <Text
                    style={[
                      styles.checkMark,
                      check.complete ? styles.checkPassed : styles.checkPending,
                    ]}
                  >
                    {check.complete ? '✓' : '○'}
                  </Text>
                  <Text style={styles.checkLabel}>{check.label}</Text>
                  <Text style={styles.checkState}>
                    {check.complete ? 'Passed' : 'Not yet checked'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {products.map((product) => (
            <View key={product.id} style={styles.product}>
              <View style={styles.productInfo}>
                <Text style={styles.productType}>CONSUMABLE</Text>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productId}>{product.id}</Text>
              </View>
              <Text style={styles.price}>{product.displayPrice}</Text>
            </View>
          ))}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Run the purchase flow</Text>
            <Text style={styles.helper}>
              Load products → Purchase → Restore / owned → Verify & finish.
              Restoring before completion checks receipt continuity.
            </Text>
            <View style={styles.actions}>
              {actions.map(({label, action, ...requirements}) => {
                const disabled =
                  !connected ||
                  busy ||
                  ('needsPurchase' in requirements &&
                    requirements.needsPurchase &&
                    !purchase) ||
                  ('needsEmptyPurchase' in requirements &&
                    requirements.needsEmptyPurchase &&
                    Boolean(purchase));
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{disabled: Boolean(disabled)}}
                    disabled={Boolean(disabled)}
                    onPress={() => void run(action)}
                    style={[
                      styles.button,
                      label === 'Verify & finish'
                        ? styles.primaryButton
                        : styles.secondaryButton,
                      disabled && styles.disabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        label === 'Verify & finish'
                          ? styles.primaryText
                          : styles.secondaryText,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View
            style={[
              styles.result,
              failed
                ? styles.resultFailed
                : checks.finished
                  ? styles.resultPassed
                  : styles.resultWaiting,
            ]}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.resultLabel}>
              {busy
                ? 'WORKING'
                : failed
                  ? 'NEEDS ATTENTION'
                  : checks.finished
                    ? 'VERIFIED & COMPLETED'
                    : 'CURRENT RESULT'}
            </Text>
            <Text selectable style={styles.status}>
              {status}
            </Text>
          </View>
          <Text style={styles.note}>
            App Tester simulates checkout. These checks do not establish
            production readiness or replace Live App Testing.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F8FAFC'},
  content: {
    padding: 22,
    gap: 18,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {gap: 10},
  eyebrow: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  description: {color: '#475569', fontSize: 15, lineHeight: 22},
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {color: '#115E59', fontSize: 12, fontWeight: '600'},
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {color: '#0F172A', fontSize: 16, fontWeight: '700'},
  helper: {color: '#64748B', fontSize: 13, lineHeight: 20},
  checkGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  check: {
    width: '47%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 7,
    rowGap: 4,
  },
  checkMark: {fontSize: 18, fontWeight: '700'},
  checkPassed: {color: '#0F766E'},
  checkPending: {color: '#94A3B8'},
  checkLabel: {fontSize: 12, color: '#334155', fontWeight: '600'},
  checkState: {
    width: '100%',
    fontSize: 11,
    color: '#64748B',
    paddingLeft: 24,
  },
  product: {
    padding: 18,
    backgroundColor: '#EFFAF7',
    borderWidth: 1,
    borderColor: '#99D8C8',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productInfo: {flex: 1, gap: 6},
  productType: {
    color: '#0F766E',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  productTitle: {color: '#0F172A', fontSize: 18, fontWeight: '700'},
  productId: {color: '#64748B', fontSize: 11},
  price: {color: '#115E59', fontSize: 22, fontWeight: '700'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  button: {
    width: '47%',
    padding: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  primaryButton: {backgroundColor: '#0F766E'},
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  buttonText: {fontSize: 13, fontWeight: '600'},
  primaryText: {color: '#FFFFFF'},
  secondaryText: {color: '#334155'},
  disabled: {opacity: 0.4},
  result: {borderWidth: 1, borderRadius: 15, padding: 17, gap: 8},
  resultFailed: {backgroundColor: '#FFF1F2', borderColor: '#FDA4AF'},
  resultPassed: {backgroundColor: '#ECFDF5', borderColor: '#6EE7B7'},
  resultWaiting: {backgroundColor: '#F0F9FF', borderColor: '#BAE6FD'},
  resultLabel: {
    color: '#334155',
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  status: {color: '#0F172A', fontSize: 14, lineHeight: 22},
  note: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
