import {useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {Link, useRouter, type Href} from 'expo-router';
import {getStorefront} from 'expo-iap';
import {isAmazonRvsSandboxEnabled} from '../src/utils/vegaRuntime';

type MenuItem = {
  id: string;
  href: Href;
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'provider-acceptance',
    href: '/provider-acceptance',
    icon: '✓',
    title: 'Provider Acceptance',
    subtitle: 'Identity, receipt continuity, verify & finish',
    accentColor: '#0F766E',
  },
  {
    id: 'all-products',
    href: '/all-products',
    icon: '📱',
    title: 'All Products',
    subtitle: 'View all items at once',
    accentColor: '#EF4444',
  },
  {
    id: 'purchase-flow',
    href: '/purchase-flow',
    icon: '🛒',
    title: 'In-App Purchase Flow',
    subtitle: 'One-time products',
    accentColor: '#2563EB',
  },
  {
    id: 'subscription-flow',
    href: '/subscription-flow',
    icon: '🔄',
    title: 'Subscription Flow',
    subtitle: 'Recurring subscriptions',
    accentColor: '#16A34A',
  },
  {
    id: 'available-purchases',
    href: '/available-purchases',
    icon: '📦',
    title: 'Available Purchases',
    subtitle: 'View past purchases',
    accentColor: '#7C3AED',
  },
  {
    id: 'offer-code',
    href: '/offer-code',
    icon: '🎁',
    title: 'Offer Code Redemption',
    subtitle: 'Redeem promo codes',
    accentColor: '#4B5563',
  },
  {
    id: 'alternative-billing',
    href: '/alternative-billing',
    icon: '🌐',
    title: 'Alternative Billing',
    subtitle: 'External payment links',
    accentColor: '#EA580C',
  },
];

export default function Home() {
  const router = useRouter();
  const [storefront, setStorefront] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const sandbox = isAmazonRvsSandboxEnabled();

  useEffect(() => {
    if ((Platform.OS as string) === 'kepler') {
      return;
    }

    getStorefront()
      .then((code) => {
        setStorefront(code);
      })
      .catch((error) => {
        // Silently fail on unsupported platforms
        console.log('Storefront not available:', error.message);
      });
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.eyebrow}>LEARN TO BUILD A FIREOS PROVIDER</Text>
      <Text style={styles.title}>Amazon Community Example</Text>
      <Text style={styles.subtitle}>
        Explore the Expo purchase flows with an educational community provider.
        {storefront ? ` · Store ${storefront}` : ''}
      </Text>
      <View style={styles.exampleNotice}>
        <Text style={styles.exampleNoticeTitle}>Learning example only</Text>
        <Text style={styles.exampleNoticeText}>
          For production apps, use the official OpenIAP Amazon integration.
        </Text>
        <Link href="https://openiap.dev/docs/setup/store/amazon" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            style={styles.officialLink}
          >
            <Text style={styles.officialLinkText}>Official Amazon setup ↗</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.push('/community-package')}
        style={styles.packageGuide}
      >
        <Text style={styles.packageGuideTitle}>How to use this package →</Text>
        <Text style={styles.packageGuideText}>
          Install · Configure · Rebuild · Framework support
        </Text>
      </TouchableOpacity>
      <View style={styles.providerBadge}>
        <Text style={styles.providerBadgeText}>
          amazon-example · {sandbox ? 'App Tester' : 'Production RVS'}
        </Text>
      </View>
      <Text style={styles.scopeNote}>
        {sandbox
          ? 'Purchases are simulated. Live App Testing remains separate.'
          : 'Production RVS requires an Appstore test build. Verify lifecycle states before granting access.'}{' '}
        Offer codes and alternative billing are not supported by this provider.
      </Text>
    </View>
  );

  const renderItem = (item: MenuItem, index: number) => {
    return (
      <TouchableOpacity
        key={item.id}
        focusable
        hasTVPreferredFocus={focusedIndex === index}
        onFocus={() => setFocusedIndex(index)}
        onPress={() => router.push(item.href)}
        style={[
          styles.menuItem,
          focusedIndex === index && styles.menuItemFocused,
        ]}
      >
        <View
          style={[styles.iconContainer, {backgroundColor: item.accentColor}]}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
        </View>
        <View style={styles.menuLabel}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.contentInner}>
        {renderHeader()}
        <View style={styles.menuGrid}>{MENU_ITEMS.map(renderItem)}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  contentInner: {
    maxWidth: 430,
    width: '100%',
  },
  eyebrow: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  exampleNotice: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  exampleNoticeTitle: {color: '#115E59', fontSize: 15, fontWeight: '700'},
  exampleNoticeText: {
    color: '#134E4A',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  officialLink: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  officialLinkText: {color: '#0F766E', fontSize: 14, fontWeight: '700'},
  packageGuide: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
    minHeight: 64,
    padding: 16,
  },
  packageGuideTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  packageGuideText: {color: '#CCFBF1', fontSize: 12, lineHeight: 18},
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },
  providerBadgeText: {color: '#115E59', fontSize: 12, fontWeight: '600'},
  scopeNote: {color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 12},
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#475569',
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItemFocused: {
    borderColor: '#0F766E',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  menuIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    color: '#111827',
    fontSize: 16,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  menuSubtitle: {
    color: '#64748B',
    fontSize: 14,
    flexShrink: 1,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 24,
    lineHeight: 26,
    marginLeft: 8,
  },
});
