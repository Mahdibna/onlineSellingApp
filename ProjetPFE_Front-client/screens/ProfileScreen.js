import { Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useAuth from 'auth/useAuth';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { BlurView } from 'expo-blur';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { normalizeY } from 'utils/normalize';
import { useQuery } from 'react-query';
import { ProfileAPI } from 'api/ProfileAPI';

const ProfileScreen = () => {
  const scrollViewRef = useRef(null);
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const initialFetchRef = useRef(true);

  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery('profile', ProfileAPI.getCurrentProfile, {
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    onSuccess: () => {
      initialFetchRef.current = false;
    },
    staleTime: 60000,
    cacheTime: 300000,
  });

  useEffect(() => {
    if (profileData) {
      setUserData({
        nom: profileData?.name || user?.nom || 'Guest User',
        email: profileData?.email || user?.email || 'guest@example.com',
        profil: profileData?.profil || user?.profil,
        tel: profileData?.tel || user?.tel || '',
      });
      setImageError(false);
    } else if (user) {
      setUserData({
        nom: user?.nom || 'Guest User',
        email: user?.email || 'guest@example.com',
        profil: user?.profil,
        tel: user?.tel || '',
      });
      setImageError(false);
    }
  }, [profileData, user]);

  useFocusEffect(
    useCallback(() => {
      if (initialFetchRef.current) {
        refetch();
      }
      return () => {
        initialFetchRef.current = true;
      };
    }, [refetch])
  );

  const getImageSource = () => {
    if (imageError || !userData?.profil) {
      return require('assets/default-profile.png');
    }

    try {
      if (userData.profil.startsWith('http')) {
        return { uri: userData.profil };
      }

      const baseUrl = Platform.OS === 'android' ? API_URL : 'http://localhost:8080';
      const profilePath = userData.profil.startsWith('/') ? userData.profil : `/${userData.profil}`;
      const imageUrl = `${baseUrl}${profilePath}`;
      return { uri: imageUrl };
    } catch (error) {
      return require('assets/default-profile.png');
    }
  };

  const Row = ({ icon, title, iconColor, index, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Animated.View
          style={styles.row}
          entering={FadeInDown.delay(index * 80)
            .duration(800)
            .damping(12)
            .springify()}
        >
          <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>{icon}</View>
          <Typo size={16} style={styles.rowText}>
            {title}
          </Typo>
          <Octicons name="chevron-right" size={24} color="black" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typo color="red">Error loading profile: {error.message}</Typo>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            initialFetchRef.current = true;
            refetch();
          }}
        >
          <Typo color={colors.white}>Retry</Typo>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenComponent noPadding>
      <BlurView intensity={100} tint="extraLight" style={StyleSheet.absoluteFill} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.topRow}>
            <View style={styles.profileImageContainer}>
              <Image
                source={getImageSource()}
                style={styles.img}
                defaultSource={require('assets/default-profile.png')}
                onError={() => {
                  setImageError(true);
                }}
              />
            </View>
            <View style={styles.profileInfo}>
              <Typo size={22} style={styles.name}>
                {userData.nom}
              </Typo>
              <Typo size={16} style={styles.email}>
                {userData.email}
              </Typo>
              {userData.tel && (
                <Typo size={14} style={styles.phone}>
                  {userData.tel}
                </Typo>
              )}
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <Row
              title={'Edit profile'}
              iconColor={'#fbdbe6'}
              icon={<Ionicons name="person" size={24} color={'#eb4b8b'} />}
              index={0}
              onPress={() => navigation.navigate('EditProfileScreen', { userData })}
            />

            <Row
              title={'My Orders'}
              iconColor={'#d1d1d1'}
              icon={<Ionicons name="cart" size={24} color={colors.black} />}
              index={1}
              onPress={() => navigation.navigate('MyOrders')}
            />

            <Row
              title={'Address'}
              iconColor={'#dedffd'}
              icon={<Ionicons name="location" size={24} color={'#5d5be5'} />}
              index={2}
              onPress={() => navigation.navigate('SavedAddresses')}
            />

            <Row
              title={'Complaints'}
              iconColor={'#ffe6e6'}
              icon={<Ionicons name="alert-circle" size={24} color={'#e53935'} />}
              index={3}
              onPress={() => navigation.navigate('Complaints')}
            />

        

            <Row
              title={'Notifications'}
              iconColor={'#F5E8E4'}
              icon={<Ionicons name="notifications" size={24} color={'#860A35'} />}
              index={5}
              onPress={() => navigation.navigate('Notifications')}
            />

            <Row
              title={'Log out'}
              iconColor={'#ffd1d1'}
              icon={<MaterialCommunityIcons name="logout" size={24} color={'#ff0000'} />}
              index={6}
              onPress={logout}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacingY._60,
    paddingTop: spacingY._20,
    paddingHorizontal: spacingX._20,
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    alignItems: 'center',
    gap: spacingX._10,
    marginBottom: spacingY._20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  img: {
    height: normalizeY(110),
    width: normalizeY(110),
    borderRadius: normalizeY(60),
    borderWidth: normalizeY(3),
    borderColor: colors.lightBlue,
    backgroundColor: colors.lightGrey,
  },
  profileInfo: {
    gap: spacingY._7,
    marginTop: spacingY._5,
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    color: colors.dark,
  },
  email: {
    color: colors.gray,
    fontWeight: '500',
  },
  phone: {
    color: colors.gray,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    paddingVertical: spacingY._10,
    paddingRight: spacingX._5,
  },
  rowText: {
    fontWeight: '500',
    flex: 1,
    color: colors.dark,
  },
  iconContainer: {
    padding: spacingY._10,
    borderRadius: radius._12,
  },
  bottomContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._20,
    shadowColor: colors.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    padding: spacingY._15,
    marginBottom: spacingY._20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default ProfileScreen;