import {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {providerTutorial} from '../utils/providerTutorial';

type TutorialStep = (typeof providerTutorial)[number];

function Explanation({step}: {step: TutorialStep}) {
  return (
    <View style={styles.explanation}>
      <Text style={styles.eyebrow}>
        {step.number} · {step.title.toUpperCase()}
      </Text>
      <Text style={styles.heading}>{step.heading}</Text>
      <Text style={styles.description}>{step.description}</Text>
      <Text selectable style={styles.contract}>
        {step.contract}
      </Text>
      <Text style={styles.source}>Read: {step.source}</Text>
    </View>
  );
}

export default function ProviderTutorial() {
  const wide = useWindowDimensions().width >= 768;
  const [selected, setSelected] = useState<TutorialStep>(providerTutorial[0]);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How the pieces connect</Text>
      <Text style={styles.hint}>
        {wide
          ? 'Choose a layer to inspect its role.'
          : 'Tap a layer for its role and source.'}
      </Text>
      <View style={[styles.layout, wide && styles.wideLayout]}>
        <View style={[styles.menu, wide && styles.wideMenu]}>
          {providerTutorial.map((step) => (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              accessibilityLabel={`Learn about ${step.title}`}
              accessibilityState={{selected: wide && selected.id === step.id}}
              onPress={() => {
                setSelected(step);
                if (!wide) setVisible(true);
              }}
              style={({pressed}) => [
                styles.menuItem,
                wide && selected.id === step.id && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.number}>{step.number}</Text>
              <Text style={styles.menuTitle}>{step.title}</Text>
              <Text style={styles.affordance}>
                {wide ? '›' : 'Learn more ↗'}
              </Text>
            </Pressable>
          ))}
        </View>
        {wide ? <Explanation step={selected} /> : null}
      </View>
      <Modal
        visible={!wide && visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text style={styles.sectionTitle}>Integration guide</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close integration guide"
                hitSlop={8}
                onPress={() => setVisible(false)}
                style={styles.close}
              >
                <Text style={styles.closeText}>Close ✕</Text>
              </Pressable>
            </View>
            <ScrollView>
              <Explanation step={selected} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: 10},
  sectionTitle: {color: '#0F172A', fontSize: 16, fontWeight: '700'},
  hint: {color: '#64748B', fontSize: 12, lineHeight: 18},
  layout: {gap: 12},
  wideLayout: {flexDirection: 'row', alignItems: 'flex-start'},
  menu: {flexDirection: 'row', gap: 9},
  wideMenu: {width: 150, flexDirection: 'column'},
  menuItem: {
    flex: 1,
    gap: 7,
    minHeight: 86,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DDE5EE',
    borderRadius: 12,
  },
  selected: {borderColor: '#0F766E', backgroundColor: '#EFFAF7'},
  pressed: {opacity: 0.7},
  number: {fontSize: 10, color: '#64748B', fontWeight: '600'},
  menuTitle: {fontSize: 13, color: '#334155', fontWeight: '600'},
  affordance: {fontSize: 10, color: '#0F766E'},
  explanation: {flex: 1, minWidth: 0, gap: 14, padding: 18},
  eyebrow: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heading: {color: '#0F172A', fontSize: 22, fontWeight: '700'},
  description: {color: '#475569', fontSize: 14, lineHeight: 22},
  contract: {
    color: '#115E59',
    fontSize: 12,
    lineHeight: 20,
    backgroundColor: '#EFFAF7',
    padding: 14,
    borderRadius: 10,
  },
  source: {color: '#64748B', fontSize: 12, lineHeight: 18},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 6,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  close: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 8},
  closeText: {color: '#0F766E', fontWeight: '600', fontSize: 13},
});
