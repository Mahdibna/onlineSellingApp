import { Alert, Platform } from 'react-native';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';


/**
 * Utility service for invoice functionality that can be used
 * across different screens (payment success, order details, my orders, etc.)
 */
const InvoiceUtilityService = {
  /**
   * Download and open an invoice PDF for any order type
   * (online payment or cash on delivery)
   * 
   * @param {number|string} orderId - The order ID
   * @param {function} setDownloadingCallback - Function to set downloading state
   * @returns {Promise<void>}
   */
  downloadInvoice: async (orderId, setDownloadingCallback = null) => {
    if (!orderId) {
      Alert.alert('Error', 'Cannot download invoice: Order ID not found');
      return;
    }

    try {
      // Set downloading state if callback provided
      if (setDownloadingCallback) {
        setDownloadingCallback(true);
      }
      
      // Get the authorization token for the download
      const token = await InvoiceUtilityService.getAuthToken();
      
      // Create a filename for the PDF
      const fileName = `invoice_${orderId}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      console.log(`Downloading invoice for order ${orderId} to ${fileUri}`);
      
      // Use Expo's FileSystem to download the file directly
      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_URL}/api/invoices/${orderId}`,
        fileUri,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );
      
      try {
        const { uri } = await downloadResumable.downloadAsync();
        console.log('Invoice downloaded to:', uri);
        
        // Now we can share or open the PDF
        await InvoiceUtilityService.openDownloadedFile(uri);
      } catch (downloadError) {
        console.error('Error during file download:', downloadError);
        Alert.alert(
          'Download Error',
          'Failed to download the invoice. Please check your connection and try again.'
        );
      }
      
      // Reset downloading state if callback provided
      if (setDownloadingCallback) {
        setDownloadingCallback(false);
      }
    } catch (error) {
      console.error('Error initiating invoice download:', error);
      Alert.alert(
        'Download Error',
        'Failed to initiate invoice download. Please try again later.'
      );
      
      // Reset downloading state if callback provided
      if (setDownloadingCallback) {
        setDownloadingCallback(false);
      }
    }
  },

  /**
   * Helper method to open/share a downloaded file
   * 
   * @param {string} uri - File URI to open
   * @returns {Promise<void>}
   */
  openDownloadedFile: async (uri) => {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, use the Sharing API
        await Sharing.shareAsync(uri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
        });
      } else if (Platform.OS === 'android') {
        // On Android, try multiple approaches
        try {
          // First try to use Sharing API
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
          });
        } catch (sharingError) {
          // If sharing fails, try to open the PDF with a PDF viewer app
          console.log("Sharing failed, trying to open with viewer:", sharingError);
          const contentUri = await FileSystem.getContentUriAsync(uri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf',
          });
        }
      }
    } catch (error) {
      console.error('Error opening downloaded file:', error);
      Alert.alert(
        'Error',
        'The invoice was downloaded but could not be opened. You can find it in your app documents folder.'
      );
    }
  },

  /**
   * Helper method to get the auth token
   * 
   * @returns {Promise<string|null>} The authentication token or null
   */
  getAuthToken: async () => {
    try {
      // Try to get token from multiple possible storage locations
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }
};

export default InvoiceUtilityService;