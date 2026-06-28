import { useState, useEffect, useCallback, memo } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import useAuth from '../auth/useAuth';
import { useQuery } from 'react-query';
import { ProfileAPI } from 'api/ProfileAPI';


// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom FormInput component
const FormInputCustom = memo(
  ({ label, iconName, value, onChangeText, editable = true, multiline, numberOfLines, ...props }) => {
    return (
      <View style={styles.inputContainer}>
        <Typo style={styles.inputLabel}>
          {label}
          {editable && <Typo style={{ color: colors.red }}> *</Typo>}
        </Typo>
        <View
          style={[styles.inputView, !editable && styles.disabledInput]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={18} color={editable ? '#777' : colors.darkGray} />
          </View>
          <View style={styles.divider} />
          <TextInput
            style={[styles.input, !editable && styles.disabledInputText]}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="rgba(117, 117, 117, 0.7)"
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={multiline ? 'default' : 'default'}
            blurOnSubmit={multiline ? false : true}
            {...props}
          />
          {!editable && (
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={18} color={colors.darkGray} />
            </View>
          )}
        </View>
      </View>
    );
  }
);

function PartnerApplicationScreen({ navigation }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    businessAddress: '',
    businessDescription: '',
    contactPerson: '',
    contactPhone: '',
    documentImage: null,
  });
  const [tempForm, setTempForm] = useState(form); // Temporary state for immediate updates
  const debouncedForm = useDebounce(tempForm, 300); // Debounced state

  const { data: profileData, isLoading: profileLoading } = useQuery(
    'profile',
    ProfileAPI.getCurrentProfile,
    {
      enabled: !!user,
      retry: (failureCount, error) => {
        if (error?.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 60000,
      cacheTime: 300000,
    }
  );

  // Sync debounced form to main form state
  useEffect(() => {
    setForm(debouncedForm);
  }, [debouncedForm]);

  useEffect(() => {
    const name =   profileData?.name || user?.nom || 'souad';
    const phone = profileData?.tel || user?.tel || '27957245';

    setTempForm(prev => ({
      ...prev,
      contactPerson: name,
      contactPhone: phone,
    }));
  }, [profileData, user]);

  const handleChange = useCallback((name, value) => {
    if (name === 'contactPerson' || name === 'contactPhone') {
      return;
    }
    setTempForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Need access to your photos to continue');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleChange('documentImage', result.assets[0].uri);
    }
  };

  const submitApplication = async () => {
    for (const key in form) {
      if (!form[key] && key !== 'documentImage') {
        Alert.alert(
          'Missing Information',
          `Please fill in your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'documentImage' && form[key]) {
          const filename = form[key].split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image';

          formData.append('document', {
            uri: form[key],
            name: filename,
            type,
          });
        } else {
          formData.append(key, form[key]);
        }
      });

      await axios.post(`${API_URL}/api/partner-applications`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert(
        'Application Submitted',
        'Your partner application has been submitted. We will review your information and get back to you soon.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Partner application error:', error);
      let errorMessage = 'Failed to submit your application. Please try again later.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Application Status', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Typo size={18} style={styles.headerTitle}>
          Partner Application
        </Typo>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.banner}>
          <LinearGradient
            colors={['#4A00E0', '#8E2DE2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <Ionicons name="diamond" size={40} color="white" />
            <Typo style={styles.bannerTitle}>Partner Benefits</Typo>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Typo style={styles.benefitText}>Special promotions for your products</Typo>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Typo style={styles.benefitText}>Priority customer support</Typo>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Typo style={styles.benefitText}>Lower commission fees</Typo>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Typo style={styles.benefitText}>Featured placement in categories</Typo>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Typo size={16} style={styles.sectionTitle}>
            Business Information
          </Typo>

          <FormInputCustom
            label="Business Name"
            iconName="business"
            value={tempForm.businessName}
            onChangeText={(text) => handleChange('businessName', text)}
          />

          <FormInputCustom
            label="Business Address"
            iconName="location"
            value={tempForm.businessAddress}
            onChangeText={(text) => handleChange('businessAddress', text)}
          />

          <FormInputCustom
            label="Business Description"
            iconName="document-text"
            value={tempForm.businessDescription}
            onChangeText={(text) => handleChange('businessDescription', text)}
            multiline
            numberOfLines={4}
          />

          <Typo size={16} style={styles.sectionTitle}>
            Contact Information
          </Typo>

          <FormInputCustom
            label="Contact Person"
            iconName="person"
            value={tempForm.contactPerson}
            onChangeText={(text) => handleChange('contactPerson', text)}
            editable={false}
          />

          <FormInputCustom
            label="Contact Phone"
            iconName="call"
            value={tempForm.contactPhone}
            onChangeText={(text) => handleChange('contactPhone', text)}
            keyboardType="phone-pad"
            editable={false}
          />

          {tempForm.documentImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: tempForm.documentImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => handleChange('documentImage', null)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitApplication}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Typo style={styles.submitText}>Submit Application</Typo>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacingY._40,
  },
  banner: {
    marginHorizontal: spacingX._20,
    marginTop: spacingY._15,
    borderRadius: radius._10,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: spacingY._20,
    alignItems: 'center',
  },
  bannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacingY._10,
  },
  benefitsList: {
    marginTop: spacingY._15,
    width: '100%',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  benefitText: {
    color: 'white',
    marginLeft: spacingX._8,
  },
  formContainer: {
    padding: spacingX._20,
    marginTop: spacingY._20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacingY._10,
    marginTop: spacingY._20,
  },
  inputContainer: {
    marginTop: spacingY._20,
    borderRadius: radius._15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: spacingY._10,
    letterSpacing: 0.5,
  },
  inputView: {
    backgroundColor: '#FDFCFB',
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    marginTop: spacingY._5,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacingX._12,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    height: '100%',
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: '80%',
    width: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  lockIconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: colors.lighterGray,
    borderColor: colors.lighterGray,
  },
  disabledInputText: {
    color: colors.darkGray,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: spacingY._10,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: radius._10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._15,
    borderRadius: radius._10,
    alignItems: 'center',
    marginTop: spacingY._40, 
  },
  submitText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PartnerApplicationScreen;