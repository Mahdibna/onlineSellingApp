import React, { useState } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import useAuth from 'auth/useAuth';

// Components
import ScreenComponent from 'components/ScreenComponent';
import AddressForm from 'components/AddressForm';
import Header from 'components/Header';

// Config
import { spacingX, spacingY } from 'config/spacing';


function EditAddressScreen({ navigation, route }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Get the address data from navigation params
  const addressFromParams = route.params?.address || {};
  const onSave = route.params?.onSave;
  
  // Determine if we're editing or adding a new address
  const isEditing = addressFromParams && Object.keys(addressFromParams).length > 0;

  const handleSaveAddress = async (formData) => {
    try {
      setLoading(true);
      
      // Create the payload in the format expected by the backend
      const payload = {
        rue: formData.rue.trim(),
        numero: formData.numero.trim(),
        ville: formData.ville.trim(),
        pays: formData.pays.trim(),
        indication: formData.indication.trim()
      };
      
      console.log('Saving address with payload:', payload);
      
      // Use the API endpoint that matches the backend controller
      const url = `${API_URL}/api/clients/profile/address`;
      const method = isEditing ? 'put' : 'post';
      
      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response:', response.data);
      
      // Notify parent component that we've updated the address and pass back the updated data
      if (onSave && typeof onSave === 'function') {
        onSave(response.data);
      }
      
      // Navigate back to the previous screen
      navigation.goBack();
    } catch (error) {
      console.error('Error saving address:', error);
      
      // Handle specific error types
      if (error.response?.status === 404) {
        Alert.alert("Error", "Client not found. Please try logging in again.");
      } else if (error.response?.status === 400) {
        Alert.alert("Error", error.response.data || "Invalid address information.");
      } else {
        Alert.alert(
          "Error", 
          error.response?.data || "Failed to save address. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenComponent style={styles.container}>
      <AddressForm
        initialData={addressFromParams}
        onSave={handleSaveAddress}
        onCancel={() => navigation.goBack()}
        isEditMode={isEditing}
        customRender={{
          hideContainer: false,
          header: (
            <Header
              label={isEditing ? 'Manage My Address' : 'Add Address'}
              onBack={() => navigation.goBack()}
            />
          ),
        }}
        containerStyle={styles.formContainer}
      />
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._40,
  },
});

export default EditAddressScreen;