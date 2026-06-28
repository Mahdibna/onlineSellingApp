import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native';
import { useNotifications } from 'auth/NotificationsContext';
import colors from '../config/colors';
import ScreenComponent from 'components/ScreenComponent';
import { radius, spacingX, spacingY } from 'config/spacing';
import { AntDesign } from '@expo/vector-icons';
import Typo from 'components/Typo';
import { normalizeY } from 'utils/normalize';
import Header from 'components/Header';
import { format } from 'date-fns';
import useAuth from 'auth/useAuth';


function NotificationsScreen({ navigation }) {
  const { notifications, refreshNotifications, markAsRead, markAllAsRead, loading } = useNotifications();
  const scrollY = useRef(new Animated.Value(0)).current;
  const SPACING = spacingY._20;
  const CARD_HEIGHT = normalizeY(55);
  const ITEM_SIZE = CARD_HEIGHT + SPACING * 3;
   const { user, logout } = useAuth();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleNotificationPress = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch(notification.type) {
      case 'ORDER_STATUS':
        navigation.navigate('OrderDetails', { orderId: notification.referenceId });
        break;
      case 'NEW_PRODUCT':
        navigation.navigate('ItemDetails', { productId: notification.referenceId });
        break;
      case 'COMPLAINT_STATUS':
        navigation.navigate('ComplaintsScreen');
        break;
        case 'ROLE_CHANGE':
          logout();
          break
      // Add other cases as needed
      default:
        // Just mark as read but don't navigate
        break;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <ScreenComponent style={styles.container}>
      <Header 
        label={'Notifications'} 
        rightComponent={
          notifications.length > 0 ? (
            <TouchableOpacity onPress={markAllAsRead}>
              <Typo style={{ color: colors.primary }}>Mark all as read</Typo>
            </TouchableOpacity>
          ) : null
        }
      />
      <Animated.FlatList
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        refreshing={loading}
        onRefresh={refreshNotifications}
        showsVerticalScrollIndicator={false}
        data={notifications}
        contentContainerStyle={{
          padding: SPACING,
        }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const inputRange = [-1, 0, ITEM_SIZE * index, ITEM_SIZE * (index + 2)];
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [1, 1, 1, 0],
          });
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [1, 1, 1, 0],
          });

          const isRead = item.read;
          return (
            <TouchableOpacity onPress={() => handleNotificationPress(item)}>
              <Animated.View
                style={[
                  styles.notiView,
                  {
                    backgroundColor: isRead ? colors.light : colors.grayBG,
                    marginBottom: SPACING,
                    padding: SPACING,
                    transform: [{ scale }],
                    opacity,
                  },
                  isRead && {
                    borderColor: colors.primary,
                  },
                ]}>
                <View style={{ height: CARD_HEIGHT }} />
                <View
                  style={{ flex: 1, justifyContent: 'space-between', marginVertical: -spacingY._10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacingX._10 }}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isRead ? colors.primary : colors.lightGray,
                        },
                      ]}
                    />
                    <Typo size={15} style={{ fontWeight: '600' }}>
                      {item.title}
                    </Typo>
                  </View>

                  <Typo numberOfLines={2} style={{ color: colors.gray }}>
                    {item.message}
                  </Typo>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: spacingX._5,
                    }}>
                    <AntDesign name="clockcircle" size={14} color={colors.primary} />
                    <Typo style={styles.dateTxt}>{formatDate(item.createdAt)}</Typo>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  notiView: {
    flexDirection: 'row',
    borderRadius: radius._15,
    borderColor: colors.lightGray,
    borderWidth: 0.5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  dateTxt: {
    opacity: 0.8,
    color: colors.primary,
    alignSelf: 'flex-end',
    fontWeight: '500',
    fontSize: normalizeY(13),
  },
  dot: {
    height: normalizeY(10),
    width: normalizeY(10),
    borderRadius: radius._10,
  },
});
export default NotificationsScreen;