import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing'; // Added spacingX to import
import Typo from 'components/Typo';
import { normalizeY } from 'utils/normalize';

const SecurityTips = () => {
  return (
    <View style={styles.securitySectionContainer}>
      <View style={styles.securityHeader}>
        <Feather name="shield" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Typo style={styles.securitySectionTitle}>Account Security</Typo>
      </View>
      
      <View style={styles.securityTips}>
        <View style={styles.securityTipRow}>
          <Feather name="check-circle" size={14} color="#4CAF50" style={styles.securityTipIcon} />
          <Typo style={styles.securityTipText}>
            Use a strong, unique password
          </Typo>
        </View>
        <View style={styles.securityTipRow}>
          <Feather name="check-circle" size={14} color="#4CAF50" style={styles.securityTipIcon} />
          <Typo style={styles.securityTipText}>
            Never share your login credentials
          </Typo>
        </View>
        <View style={styles.securityTipRow}>
          <Feather name="check-circle" size={14} color="#4CAF50" style={styles.securityTipIcon} />
          <Typo style={styles.securityTipText}>
            Remember to log out on shared devices
          </Typo>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  securitySectionContainer: {
    backgroundColor: 'rgba(230, 238, 255, 0.6)',
    borderRadius: radius._15, // Using radius from config
    padding: spacingY._15,
    marginBottom: spacingY._25,
    marginTop: spacingY._30,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  securitySectionTitle: {
    fontSize: normalizeY(16),
    fontWeight: '600',
    color: '#444',
  },
  securityTips: {
    marginTop: spacingY._5,
  },
  securityTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacingY._5,
  },
  securityTipIcon: {
    marginRight: spacingX._8, // Now defined
  },
  securityTipText: {
    color: '#555',
    fontSize: normalizeY(14),
  },
});

export default SecurityTips;