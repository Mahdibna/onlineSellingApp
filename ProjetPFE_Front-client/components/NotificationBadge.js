import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNotifications } from 'auth/NotificationsContext';
import Typo from './Typo';
import colors from '../config/colors';
import { radius } from 'config/spacing';

function NotificationBadge({ onPress, iconSize = 24, badgeSize = 16 }) {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <AntDesign name="bells" size={iconSize} color={colors.black} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { width: badgeSize, height: badgeSize }]}>
          <Typo style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Typo>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 5,
    backgroundColor: colors.lighterGray,
    borderRadius: radius._20,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: radius._15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 16,
    height: 16,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;