import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { useFocusEffect } from '@react-navigation/native';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import axios from 'axios';
import useAuth from 'auth/useAuth';
import AddressForm from 'components/AddressForm';
import Header from 'components/Header';


function SavedAddressesScreen({ navigation }) {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    console.log('SavedAddressesScreen rendered');
  });

  const fetchClientAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/clients/profile/address`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userName = response.data?.name || user?.name || 'Client';
      const userPhone = response.data?.tel || user?.tel || '';

      const addressData = response.data?.address;
      const hasValidAddress =
        addressData && (addressData.rue || addressData.numero || addressData.ville);

      if (hasValidAddress) {
        const transformedAddress = {
          id: addressData.id || 'default',
          name: userName,
          mobile: userPhone,
          addressLine1: `${addressData.rue || ''}, ${addressData.numero || ''}, ${
            addressData.indication || ''
          }`.trim(),
          city: addressData.ville || '',
          state: addressData.pays || '',
          isDefault: true,
          hasAddress: true,
          rawData: addressData,
        };
        setAddresses([transformedAddress]);
      } else {
        const noAddressCard = {
          id: 'no-address',
          name: userName,
          mobile: userPhone,
          isDefault: true,
          hasAddress: false,
          rawData: {},
        };
        setAddresses([noAddressCard]);
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      setError(err.response?.data?.message || 'Failed to load address. Please try again.');

      if (user) {
        const fallbackCard = {
          id: 'no-address',
          name: user.name || 'Client',
          mobile: user.tel || '',
          isDefault: true,
          hasAddress: false,
          rawData: {},
        };
        setAddresses([fallbackCard]);
      } else {
        setAddresses([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchClientAddress();
      }
    }, [fetchClientAddress, token])
  );

  const handleEditAddress = useCallback((address) => {
    setCurrentAddress(address.rawData || {});
    setModalVisible(true);
  }, []);

  const handleSaveAddress = useCallback(async (formData) => {
    try {
      setSaveLoading(true);

      const payload = {
        rue: formData.rue.trim(),
        numero: formData.numero.trim(),
        ville: formData.ville.trim(),
        pays: formData.pays.trim(),
        indication: formData.indication.trim(),
      };

      const url = `${API_URL}/api/clients/profile/address`;
      const method = currentAddress && Object.keys(currentAddress).length > 0 ? 'put' : 'post';

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setModalVisible(false);
      fetchClientAddress();
    } catch (error) {
      console.error('Error saving address:', error);

      if (error.response?.status === 404) {
        Alert.alert('Error', 'Client not found. Please try logging in again.');
      } else if (error.response?.status === 400) {
        Alert.alert('Error', error.response.data || 'Invalid address information.');
      } else {
        Alert.alert('Error', error.response?.data || 'Failed to save address. Please try again.');
      }
    } finally {
      setSaveLoading(false);
    }
  }, [currentAddress, token, fetchClientAddress]);

  if (loading && addresses.length === 0) {
    return (
      <ScreenComponent style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenComponent>
    );
  }

  if (error && addresses.length === 0) {
    return (
      <ScreenComponent style={[styles.container, styles.center]}>
        <Typo style={{ color: colors.error, marginBottom: 20 }}>{error}</Typo>
        <TouchableOpacity onPress={fetchClientAddress}>
          <Typo style={{ color: colors.primary }}>Retry</Typo>
        </TouchableOpacity>
      </ScreenComponent>
    );
  }

  const displayAddresses = addresses.length > 0
    ? addresses
    : [
        {
          id: 'fallback',
          name: user?.name || 'Client',
          mobile: user?.tel || '',
          isDefault: true,
          hasAddress: false,
        },
      ];

  const isEditing = currentAddress && Object.keys(currentAddress).length > 0;

  return (
    <ScreenComponent style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Typo size={18} style={{ fontWeight: '600' }}>
          My Address
        </Typo>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {displayAddresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Typo size={12} style={styles.defaultBadgeText}>
                  Default Address
                </Typo>
              </View>
            )}

            <View style={styles.addressHeader}>
              <View style={styles.nameContainer}>
                <View style={styles.avatarCircle}>
                  <Typo style={styles.avatarText}>
                    {(address.name && address.name.charAt(0).toUpperCase()) || 'C'}
                  </Typo>
                </View>
                <Typo size={16} style={styles.nameText}>
                  {address.name || 'Client'}
                </Typo>
              </View>
            </View>

            <View style={styles.addressDetails}>
              <View style={styles.addressIconRow}>
                <View style={styles.iconCircle}>
                  <FontAwesome name="map-marker" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.addressTextContainer}>
                  {address.hasAddress ? (
                    <>
                      {address.addressLine1 && (
                        <Typo style={styles.addressText}>{address.addressLine1}</Typo>
                      )}
                      {(address.city || address.state) && (
                        <Typo style={styles.addressText}>
                          {[address.city, address.state].filter(Boolean).join(', ')}
                        </Typo>
                      )}
                    </>
                  ) : (
                    <Typo style={[styles.addressText, styles.noAddressText]}>
                      (No address now)
                    </Typo>
                  )}
                </View>
              </View>

              {address.mobile && (
                <View style={styles.addressIconRow}>
                  <View style={styles.iconCircle}>
                    <FontAwesome name="phone" size={14} color="#FFFFFF" />
                  </View>
                  <Typo style={styles.mobileText}>Mobile: {address.mobile}</Typo>
                </View>
              )}
            </View>

            <View style={styles.addressActions}>
              <TouchableOpacity
                style={[styles.editButton, !address.hasAddress && styles.addAddressButton]}
                onPress={() => handleEditAddress(address)}
              >
                <View style={styles.actionIconCircle}>
                  <FontAwesome
                    name={address.hasAddress ? 'pencil' : 'plus'}
                    size={14}
                    color={colors.primary}
                  />
                </View>
                <Typo style={styles.editButtonText}>
                  {address.hasAddress ? 'Edit' : 'Add your address'}
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="none"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1 }}>
          <AddressForm
            initialData={currentAddress || {}}
            onSave={handleSaveAddress}
            onCancel={() => setModalVisible(false)}
            isEditMode={isEditing}
            customRender={{
              hideContainer: false,
              header: (
                <Header
                  label={isEditing ? 'Edit Delivery Address' : 'Add Delivery Address'}
                  onBack={() => setModalVisible(false)}
                />
              ),
            }}
            containerStyle={styles.formContainer}
          />
          {saveLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </Modal>
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: colors.white,
  },
  formContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._60,
  },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacingX._15,
    marginBottom: spacingY._15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 102, 51, 0.1)',
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._3,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: spacingY._10,
  },
  defaultBadgeText: {
    color: colors.dark,
    fontWeight: '500',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  nameText: {
    fontWeight: '600',
    color: '#333',
  },
  addressDetails: {
    marginBottom: spacingY._12,
  },
  addressIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  addressText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  noAddressText: {
    fontStyle: 'italic',
    color: '#999',
  },
  mobileText: {
    color: '#555',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacingY._8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: spacingY._10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 50,
    marginRight: spacingX._8,
  },
  addAddressButton: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 102, 51, 0.05)',
  },
  actionIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 102, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._5,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SavedAddressesScreen;