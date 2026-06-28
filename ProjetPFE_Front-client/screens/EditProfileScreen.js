import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from '../components/Typo';
import { normalizeY } from '../utils/normalize';
import AppButton from '../components/AppButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Ionicons, Octicons } from '@expo/vector-icons';
import useAuth from '../auth/useAuth';
import { ProfileAPI } from '../api/ProfileAPI';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('screen');

function EditProfileClient() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userData } = route.params || {};
  const { user, updateUser, logout } = useAuth();

  const [fullName, setFullName] = useState(userData?.nom || user?.nom || '');
  const [email, setEmail] = useState(userData?.email || user?.email || '');
  const [tel, setTel] = useState(userData?.tel || user?.tel || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });
  const alertOpacity = useState(new Animated.Value(0))[0];
  const alertTranslateY = useState(new Animated.Value(20))[0];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const data = await ProfileAPI.getCurrentProfile();
        if (data) {
          setProfileData(data);
          setFullName(data.nom || fullName);
          setEmail(data.email || email);
          setTel(data.tel || tel);
          setImageError(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showCustomAlert('error', error.message || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (alertVisible) {
      Animated.parallel([
        Animated.timing(alertOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(alertTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(alertOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(alertTranslateY, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setAlertVisible(false));
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      alertOpacity.setValue(0);
      alertTranslateY.setValue(20);
    }
  }, [alertVisible]);

  const getImageSource = () => {
    if (imageError || (!profileData?.profil && !userData?.profil && !user?.profil)) {
      return require('../assets/default-profile.png');
    }
    try {
      let profileImagePath = profileData?.profil || userData?.profil || user?.profil;
      if (profileImagePath && profileImagePath.startsWith('file:')) {
        return { uri: profileImagePath };
      }
      if (profileImagePath && profileImagePath.startsWith('http')) {
        return { uri: profileImagePath };
      }
      const baseUrl = Platform.OS === 'android' ? API_URL : 'http://localhost:8080';
      const profilePath = profileImagePath && profileImagePath.startsWith('/') ? profileImagePath : `/${profileImagePath}`;
      const imageUrl = `${baseUrl}${profilePath}`;
      return { uri: imageUrl };
    } catch (error) {
      console.error('Error constructing image URL:', error);
      return require('../assets/default-profile.png');
    }
  };

  const showCustomAlert = (type, message) => {
    setAlertMessage({ type, message });
    setAlertVisible(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!fullName || fullName.length < 3 || fullName.length > 50) {
      newErrors.fullName = 'Name must be between 3 and 50 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!currentPassword) {
      newErrors.currentPassword = 'Please enter your current password';
    }
    if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = () => {
    if (!validate()) return;
    setShowConfirmationModal(true);
  };

  const confirmUpdateProfile = async () => {
    setShowConfirmationModal(false);
    try {
      setIsLoading(true);
      const formData = new FormData();
      const clientData = {
        nom: fullName,
        email: email,
        tel: tel,
      };
      if (newPassword) {
        clientData.motDePasse = newPassword;
      }
      formData.append('updatedClient', JSON.stringify(clientData));
      formData.append('currentPassword', currentPassword || '');
      const currentImageSource = getImageSource();
      if (currentImageSource.uri && currentImageSource.uri.startsWith('file:')) {
        const fileName = currentImageSource.uri.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('file', {
          uri: currentImageSource.uri,
          name: fileName,
          type: `image/${fileType}`,
        });
      }
      const updatedData = await ProfileAPI.updateProfile(formData);
      const emailChanged = email !== (user?.email || '');
      if (updateUser && !emailChanged) {
        const updatedUserData = {
          ...user,
          nom: fullName,
          email: email,
          tel: tel,
        };
        if (updatedData.profil) {
          if (updatedData.profil.startsWith('http')) {
            updatedUserData.profil = updatedData.profil;
          } else {
            const baseUrl = Platform.OS === 'android' ? API_URL : 'http://localhost:8080';
            const profilePath = updatedData.profil.startsWith('/') ? updatedData.profil : `/${updatedData.profil}`;
            updatedUserData.profil = `${baseUrl}${profilePath}`;
          }
        }
        await updateUser(updatedUserData);
      }
      if (emailChanged) {
        showCustomAlert('success', 'Email updated. Please log in with your new email.');
        setTimeout(() => {
          if (logout) {
            logout();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Signin' }],
            });
          }
        }, 2000);
      } else {
        showCustomAlert('success', 'Profile updated successfully!');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showCustomAlert('error', error.message || 'An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileData({
          ...profileData,
          profil: result.assets[0].uri,
        });
        setImageError(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const renderFormField = (label, value, setValue, placeholder, icon, keyboardType = 'default', isRequired = true, errorKey = null, disabled = false) => {
    const errorMessage = errors[errorKey];
    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Typo style={styles.inputLabel}>{label}</Typo>
          {isRequired && <Typo style={{ color: colors.red }}>*</Typo>}
        </View>
        <View
          style={[
            styles.inputView,
            errorMessage && styles.inputError,
            disabled && styles.disabledInput,
          ]}
        >
          <View style={styles.iconContainer}>
            <Feather name={icon} size={20} color="#777" />
          </View>
          <View style={styles.divider} />
          <TextInput
            style={[styles.input, disabled && styles.disabledText]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            editable={!disabled}
          />
        </View>
        {errorMessage && (
          <Typo size={12} style={styles.errorText}>
            {errorMessage}
          </Typo>
        )}
      </View>
    );
  };

  const renderEmailField = () => {
    const errorMessage = errors.email;
    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Typo style={styles.inputLabel}>Email</Typo>
          <Typo style={{ color: colors.red }}>*</Typo>
        </View>
        <View
          style={[styles.inputView, errorMessage && styles.inputError, styles.disabledInput]}
        >
          <View style={styles.iconContainer}>
            <Feather name="mail" size={20} color="#777" />
          </View>
          <View style={styles.divider} />
          <View style={styles.emailContainer}>
            <Typo style={[styles.emailText, styles.disabledText]} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Typo>
          </View>
        </View>
        {errorMessage && (
          <Typo size={12} style={styles.errorText}>
            {errorMessage}
          </Typo>
        )}
      </View>
    );
  };

  const renderPasswordField = (
    label,
    value,
    setValue,
    icon,
    showPassword,
    setShowPassword,
    isRequired = true,
    errorKey = null,
  ) => {
    const errorMessage = errors[errorKey];
    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Typo style={styles.inputLabel}>{label}</Typo>
          {isRequired && <Typo style={{ color: colors.red }}>*</Typo>}
        </View>
        <View style={[styles.inputView, errorMessage && styles.inputError]}>
          <View style={styles.iconContainer}>
            <Feather name={icon} size={20} color="#777" />
          </View>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (errorKey && errors[errorKey]) {
                setErrors({ ...errors, [errorKey]: '' });
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Octicons name={showPassword ? 'eye-closed' : 'eye'} size={20} color={colors.grey} />
          </TouchableOpacity>
        </View>
        {errorMessage && (
          <Typo size={12} style={styles.errorText}>
            {errorMessage}
          </Typo>
        )}
      </View>
    );
  };

  const CustomAlert = () => {
    if (!alertVisible) return null;
    return (
      <Animated.View
        style={[
          styles.alertOverlay,
          {
            opacity: alertOpacity,
            transform: [{ translateY: alertTranslateY }],
          },
        ]}
      >
        <BlurView intensity={100} tint="light" style={styles.alertBlur}>
          <View style={styles.alertBackground}>
            <View style={[styles.c1Alert, { opacity: 0.3 }]} />
            <View style={[styles.orangeCircleAlert, { opacity: 0.2 }]} />
          </View>
          <View style={styles.alertContainer}>
            <Ionicons
              name={alertMessage.type === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={alertMessage.type === 'success' ? colors.primary : colors.grey}
            />
            <Typo
              size={normalizeY(16)}
              style={[
                styles.alertText,
                { color: alertMessage.type === 'success' ? colors.dark : colors.grey },
              ]}
            >
              {alertMessage.message}
            </Typo>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.c1, { opacity: 0.5 }]} />
        <View style={[styles.orangeCircle, { bottom: '25%', left: '5%', opacity: 0.5 }]} />
        <View style={[styles.orangeCircle, { opacity: 0.4 }]} />
        <View style={styles.c2} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidView}>
        <BlurView intensity={100} tint="light" style={styles.blurContainer} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Typo size={22} style={styles.headerTitle}>
            Edit Profile
          </Typo>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileImageContainer}>
            <Image
              source={getImageSource()}
              style={styles.profileImage}
              defaultSource={require('../assets/default-profile.png')}
              onError={(e) => {
                console.log('Image failed to load:', e.nativeEvent.error);
                setImageError(true);
              }}
            />
            <TouchableOpacity style={styles.editImageButton} onPress={handleImagePicker}>
              <Feather name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {renderFormField(
              'Name',
              fullName,
              setFullName,
              'Enter your full name',
              'user',
              'default',
              true,
              'fullName',
            )}
            {renderEmailField()}
            {renderFormField(
              'Phone Number',
              tel,
              setTel,
              'Enter your phone number',
              'phone',
              'phone-pad',
              false,
            )}
            {renderPasswordField(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              'lock',
              showCurrentPassword,
              setShowCurrentPassword,
              true,
              'currentPassword',
            )}
            <View style={styles.passwordNote}>
              <Typo size={12} style={styles.noteText}>
                Your current password is required for any profile changes
              </Typo>
            </View>
            <View style={styles.sectionHeader}>
              <Typo size={18} style={styles.sectionTitle}>
                Password
              </Typo>
            </View>
            {renderPasswordField(
              'New Password',
              newPassword,
              setNewPassword,
              'key',
              showNewPassword,
              setShowNewPassword,
              false,
              'newPassword',
            )}
            {renderPasswordField(
              'Confirm Password',
              confirmPassword,
              setConfirmPassword,
              'check-square',
              showConfirmPassword,
              setShowConfirmPassword,
              false,
              'confirmPassword',
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <AppButton
            onPress={handleUpdateProfile}
            label={isLoading ? 'Updating...' : 'Update Profile'}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius._12,
            }}
            isLoading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showConfirmationModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} tint="light" style={styles.modalBlur}>
            <View style={styles.modalBackground}>
              <View style={[styles.c1Modal, { opacity: 0.3 }]} />
              <View style={[styles.orangeCircleModal, { opacity: 0.2 }]} />
            </View>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Feather name="x" size={20} color={colors.grey} />
              </TouchableOpacity>
              <Feather name="check-circle" size={40} color={colors.primary} style={styles.modalIcon} />
              <Typo size={20} style={styles.modalTitle}>
                Confirm Profile Changes
              </Typo>
              <Typo size={16} style={styles.modalText}>
                Are you sure you want to update your profile information?
              </Typo>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Typo size={16} style={styles.cancelButtonText}>
                    Cancel
                  </Typo>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmUpdateProfile}>
                  <Typo size={16} style={styles.confirmButtonText}>
                    Confirm
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      <CustomAlert />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFill,
    paddingTop: 0,
    padding: spacingY._20,
    paddingBottom: '10%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._30,
    marginBottom: spacingY._20,
    position: 'relative',
  },
  profileImage: {
    height: normalizeY(120),
    width: normalizeY(120),
    borderRadius: normalizeY(60),
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.lightGrey,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 5,
    right: '35%',
    backgroundColor: colors.primary,
    padding: spacingY._10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  formContainer: {
    paddingHorizontal: spacingX._25,
    marginTop: spacingY._10,
  },
  sectionHeader: {
    marginTop: spacingY._25,
    marginBottom: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: spacingY._8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  passwordNote: {
    marginTop: spacingY._5,
    marginBottom: spacingY._15,
  },
  noteText: {
    color: colors.grey,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: spacingY._15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  inputLabel: {
    fontSize: normalizeY(16),
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  inputView: {
    backgroundColor: '#FDFCFB',
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: spacingY._5,
    elevation: 1,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
  },
  inputError: {
    borderColor: colors.red,
  },
  disabledInput: {
    backgroundColor: '#f6f6f6',
    borderColor: '#e5e5e5',
  },
  disabledText: {
    color: '#888',
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
  },
  divider: {
    height: '80%',
    width: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacingX._15,
    fontSize: normalizeY(16),
    color: '#333',
    height: '100%',
  },
  emailContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: spacingX._15,
  },
  emailText: {
    fontSize: normalizeY(16),
    textAlign: 'left',
    textAlignVertical: 'center',
    color: '#888',
    height: '100%',
  },
  eyeIcon: {
    padding: spacingX._15,
  },
  errorText: {
    color: colors.red,
    fontSize: normalizeY(12),
    marginTop: spacingY._5,
    marginLeft: spacingX._5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacingX._25,
    paddingBottom: Platform.OS === 'ios' ? spacingY._40 : spacingY._20,
    paddingTop: spacingY._15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    width: '90%',
    borderRadius: radius._20,
    overflow: 'hidden',
    position: 'relative',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._20,
    padding: spacingY._25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacingY._15,
    right: spacingX._15,
    padding: spacingX._5,
  },
  modalIcon: {
    marginBottom: spacingY._15,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: spacingY._10,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: spacingY._25,
    color: colors.grey,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  modalButton: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: colors.greyLight,
    width: '48%',
  },
  cancelButtonText: {
    color: colors.dark,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    flex: 1,
    marginLeft: spacingX._10,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  alertOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  alertBlur: {
    width: '90%',
    borderRadius: radius._15,
    overflow: 'hidden',
    position: 'relative',
  },
  alertBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  alertContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertText: {
    marginLeft: spacingX._10,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  c1: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: colors.lightBlue,
    alignSelf: 'flex-end',
  },
  c2: {
    width: width / 1.2,
    height: width / 1.2,
    borderRadius: width / 2,
    backgroundColor: '#fee2e2',
    opacity: 0.8,
    marginBottom: 50,
    alignSelf: 'flex-end',
  },
  orangeCircle: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: '#fed7aa',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  c1Modal: {
    width: width / 2,
    height: width / 2,
    borderRadius: width / 2,
    backgroundColor: colors.lightBlue,
    alignSelf: 'flex-end',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  orangeCircleModal: {
    width: width / 2,
    height: width / 2,
    borderRadius: width / 2,
    backgroundColor: '#fed7aa',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  c1Alert: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 4,
    backgroundColor: colors.lightBlue,
    alignSelf: 'flex-end',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  orangeCircleAlert: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 4,
    backgroundColor: '#fed7aa',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
});

export default EditProfileClient;