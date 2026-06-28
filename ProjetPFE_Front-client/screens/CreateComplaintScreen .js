import React, { useState } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import useAuth from 'auth/useAuth';

// Assume this is defined in your app's theme file
import colors from 'config/colors';


const CreateComplaintScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const orderId = route.params?.orderId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [complaintType, setComplaintType] = useState('DELIVERY');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Updated complaint type options to match the backend enum values
  const complaintTypes = [
    { label: 'Order Issue', value: 'COMMANDE' },
    { label: 'Delivery Issue', value: 'DELIVERY' },
    { label: 'Product Quality', value: 'PRODUCT_QUALITY' },
    { label: 'Wrong Item', value: 'WRONG_ITEM' },
    { label: 'Damaged Package', value: 'DAMAGED_PACKAGE' },
    { label: 'Missing Items', value: 'MISSING_ITEMS' },
    { label: 'Other', value: 'OTHER' }
  ];

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your complaint');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of your issue');
      return false;
    }
    
    if (!complaintType) {
      Alert.alert('Error', 'Please select a complaint type');
      return false;
    }
    
    return true;
  };

  const submitComplaint = async () => {
    if (!validateForm()) return;
    
    if (!token) {
      Alert.alert('Error', 'You need to be logged in to submit a complaint');
      return;
    }

    if (!orderId) {
      Alert.alert('Error', 'Order information is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Create complaint data with the date field
      const complaintData = {
        title: title,
        description: description,
        type: complaintType,
        dateReclamation: new Date().toISOString(),
        commande: {
          idCommande: orderId
        }
        // Status will be set by backend as EnAttente
      };

      console.log('Submitting complaint data:', complaintData);

      const response = await axios.post(
        `${API_URL}/api/reclamations`,
        complaintData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Success',
          'Your complaint has been submitted successfully',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('MyOrders')
            }
          ]
        );
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      
      // Properly format the error message
      let message = 'Failed to submit your complaint. Please try again.';
      
      if (err.response?.data) {
        // If the error data is a string, use it directly
        if (typeof err.response.data === 'string') {
          message = err.response.data;
        } 
        // If it's an object with a message property
        else if (err.response.data.message) {
          message = err.response.data.message;
        } 
        // If it's some other object with error details
        else if (typeof err.response.data === 'object') {
          message = 'Server error: ' + JSON.stringify(err.response.data);
        }
      }
      
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find the selected complaint type label
  const selectedComplaintTypeLabel = complaintTypes.find(
    type => type.value === complaintType
  )?.label || 'Select complaint type';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>SUBMIT COMPLAINT</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Order ID:</Text>
              <Text style={styles.orderValue}>#{orderId}</Text>
            </View>
            <Text style={styles.orderSubtext}>Please provide details about your complaint</Text>
          </View>
          
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter complaint title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            placeholderTextColor={colors.muted}
          />
          
          <Text style={styles.label}>Complaint Type</Text>
          <TouchableOpacity 
            style={styles.dropdownSelector}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectedOption}>{selectedComplaintTypeLabel}</Text>
            <MaterialIcons 
              name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color={colors.muted}
            />
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={styles.dropdownList}>
              {complaintTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.dropdownItem,
                    complaintType === type.value && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    setComplaintType(type.value);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    complaintType === type.value && styles.selectedDropdownItemText
                  ]}>
                    {type.label}
                  </Text>
                  {complaintType === type.value && (
                    <MaterialIcons name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your issue in detail..."
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
            maxLength={500}
            placeholderTextColor={colors.muted}
          />
          
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={submitComplaint}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Complaint</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  orderInfoCard: {
    marginBottom: 25,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 6,
    elevation: 3,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderLabel: {
    fontWeight: 'bold',
    marginRight: 5,
    fontSize: 16,
    color: colors.text,
  },
  orderValue: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderSubtext: {
    color: colors.muted,
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  dropdownSelector: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDropdownItem: {
    backgroundColor: colors.light,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedDropdownItemText: {
    color: colors.primary,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
    color: colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    padding: 12,
    backgroundColor: '#FDEDED',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: colors.error,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CreateComplaintScreen;