import React, { useEffect, useState } from 'react';
import { API_URL } from 'config/api';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Typo from './Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { useAuth } from '../auth/AuthContext';

function PremiumBanner({ onPress }) {
  const { token, user } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  
  useEffect(() => {
    if (user && user.type === 'Partner') {
      setShowBanner(false);
    }
  }, [user]);

  const handlePress = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to apply for partner status');
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/partner-applications/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { status } = response.data;
      
      if (status === 'PENDING') {
        Alert.alert('Application In Progress', 'You have already submitted a request...');
      } else if (status === 'REJECTED') {
        Alert.alert('Application Rejected', 'Your request has been declined...');
      } else if (status === 'APPROVED') {
        Alert.alert('Already a Partner', 'You are already a verified partner...');
        setShowBanner(false);
      } else {
        onPress();
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
      onPress();
    }
  };

  if (!showBanner || (user && user.type === 'Partner')) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.premiumBanner} 
      onPress={handlePress} 
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={['#111111', '#2D2E32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.premiumContent}>
          <Ionicons name="diamond-outline" size={30} color="white" />
          <View style={styles.premiumTextContainer}>
            <Typo style={styles.premiumTitle} weight="700">Become a Style Partner</Typo>
            <Typo style={styles.premiumSubtitle}>Unlock exclusive fashion privileges & offers</Typo>
          </View>
          <Ionicons name="chevron-forward" size={22} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumBanner: {
    marginHorizontal: spacingX._20,
    marginTop: spacingY._15,
    borderRadius: radius._12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradient: {
    paddingVertical: spacingY._20,     // Increased vertical padding
    paddingHorizontal: spacingX._20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTextContainer: {
    flex: 1,
    marginHorizontal: spacingX._15,
  },
  premiumTitle: {
    color: 'white',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  premiumSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 2,
  },
});

export default PremiumBanner;