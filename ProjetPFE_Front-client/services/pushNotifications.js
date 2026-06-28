import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Request user permission for push notifications
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Get the FCM token
export async function getFCMToken() {
  let fcmToken = await AsyncStorage.getItem('fcmToken');
  
  if (!fcmToken) {
    try {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  }
  
  return fcmToken;
}

// Register the device with your backend
export async function registerDeviceForNotifications(userId) {
  try {
    const token = await getFCMToken();
    if (token) {
      const apiToken = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://your-backend-url/api/notifications/fcm-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          device: Platform.OS,
        }),
      });
      
      return response.ok;
    }
    return false;
  } catch (error) {
    console.log('Error registering device:', error);
    return false;
  }
}

// Set up notification handlers
export function setupNotifications(navigation) {
  // Handle notifications when the app is in the background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);
    
    // Navigate based on notification type
    if (remoteMessage.data && remoteMessage.data.type) {
      handleNotificationNavigation(remoteMessage.data, navigation);
    }
  });

  // Handle notifications when the app is opened from a quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Initial notification:', remoteMessage);
        
        // Navigate based on notification type
        if (remoteMessage.data && remoteMessage.data.type) {
          handleNotificationNavigation(remoteMessage.data, navigation);
        }
      }
    });

  // Handle foreground notifications
  return messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification:', remoteMessage);
    // You can show a local notification here if needed
    return remoteMessage;
  });
}

// Helper function to navigate based on notification type
function handleNotificationNavigation(data, navigation) {
  const type = data.type;
  const referenceId = data.referenceId;
  
  switch(type) {
    case 'ORDER_STATUS':
      navigation.navigate('OrderDetails', { orderId: referenceId });
      break;
    case 'NEW_PRODUCT':
      navigation.navigate('ItemDetails', { productId: referenceId });
      break;
    case 'COMPLAINT_STATUS':
      navigation.navigate('ComplaintsScreen');
      break;
    default:
      navigation.navigate('Notifications');
      break;
  }
}