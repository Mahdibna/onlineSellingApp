import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Entypo, Ionicons, AntDesign, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import colors from 'config/colors';
import { spacingX, spacingY, radius } from 'config/spacing';
import useAuth from 'auth/useAuth';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import AppButton from 'components/AppButton';
import { normalizeX, normalizeY } from 'utils/normalize';
import Toast from 'react-native-toast-message';
import { trackWishlist, trackProductView } from '../utils/RecommendationUtils';

const { width } = Dimensions.get('window');

const PackDetailsScreen = ({ route, navigation }) => {
  const { packId } = route.params;
  const { user, token } = useAuth();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentType, setPaymentType] = useState('EnLigne'); // EnLigne or Livraison
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [tempAddress, setTempAddress] = useState(null);
  const [shippingFee, setShippingFee] = useState(30);
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchPackDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/packs/${packId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setPack(response.data);
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching pack details');
    } finally {
      setLoading(false);
    }
  }, [packId, token]);

  // Fetch user's saved addresses
  const fetchAddresses = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/clients/profile/address`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const addressData = response.data?.address;
      if (addressData && (addressData.rue || addressData.numero || addressData.ville)) {
        // Format the address
        const formattedAddress = {
          id: addressData.id || 'default',
          title: "Default Address",
          phone: response.data?.tel || user?.tel || '',
          address: `${addressData.rue || ''}, ${addressData.numero || ''}, ${addressData.ville || ''}`.trim(),
          rawData: addressData,
          isDefault: true
        };
        setAddresses([formattedAddress]);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  }, [user, token]);

  useEffect(() => {
    if (token && packId) {
      fetchPackDetails();
      fetchAddresses();
    }
  }, [fetchPackDetails, fetchAddresses, packId, token]);

  const handleAddToCart = () => {
    // Check if user is logged in
    if (!user || !token) {
      Alert.alert("Login Required", "Please log in to proceed with your order.");
      return;
    }
    
    // Open order modal
    setOrderModalVisible(true);
  };

  // Format card input with spaces
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s+/g, '');
    const groups = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    return groups.join(' ');
  };

  // Format expiry date with slash
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 3) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    } else if (cleaned.length === 2) {
      return `${cleaned}/`;
    }
    return cleaned;
  };

  const handleAddDeliveryAddress = () => {
    // Navigate to address form
    navigation.navigate('AddDeliveryAddress', { 
      onSave: (newAddress) => {
        setTempAddress(newAddress);
        setSelectedAddress('temp');
      },
      existingAddress: tempAddress
    });
  };

  const incrementQuantity = () => {
    if (pack && quantity < pack.stock) {
      setQuantity(prevQuantity => prevQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prevQuantity => prevQuantity - 1);
    }
  };

  const proceedToPayment = () => {
    // Validate address selection
    if (!selectedAddress && !tempAddress) {
      Alert.alert("Error", "Please select or add a delivery address");
      return;
    }

    // For cash on delivery, proceed directly to order creation
    if (paymentType === 'Livraison') {
      handleDirectOrder();
      return;
    }

    // For online payment, show payment modal
    setOrderModalVisible(false);
    setPaymentModalVisible(true);
  };
  const handlePayment = async () => {
    // Basic validation
    if (!cardNumber.trim() || 
        !cardholderName.trim() || 
        !expiryDate.trim() || 
        !cvv.trim()) {
      Alert.alert("Error", "Please fill all card details");
      return;
    }
    
    // Check for valid card number (16 digits)
    const cleanedCardNumber = cardNumber.replace(/\s+/g, '');
    if (cleanedCardNumber.length !== 16 || !/^\d+$/.test(cleanedCardNumber)) {
      Alert.alert("Error", "Please enter a valid 16-digit card number");
      return;
    }
    
    // Check for valid expiry date (MM/YY format)
    if (!expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      Alert.alert("Error", "Please enter a valid expiry date (MM/YY)");
      return;
    }
    
    // Check for valid CVV (3 or 4 digits)
    if (!cvv.match(/^\d{3,4}$/)) {
      Alert.alert("Error", "Please enter a valid CVV code (3 or 4 digits)");
      return;
    }
  
    setProcessingPayment(true);
    
    try {
      // Calculate total amount
      const totalAmount = (pack.price * quantity) + shippingFee;
      
      // Step 1: Create a temporary payment intent
      console.log('Creating payment intent for amount:', totalAmount);
      const tempPaymentIntent = await axios.post(
        `${API_URL}/api/payments/create-intent`,
        { amount: totalAmount },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (!tempPaymentIntent.data || !tempPaymentIntent.data.id) {
        throw new Error('Failed to create payment intent - invalid response');
      }
      
      const paymentIntentId = tempPaymentIntent.data.id;
      console.log('Payment intent created with ID:', paymentIntentId);
      
      // Step 2: Process the payment
      console.log('Processing payment for intent ID:', paymentIntentId);
      const paymentRequest = {
        cardNumber: cardNumber,
        cardholderName: cardholderName,
        expiryDate: expiryDate,
        cvv: cvv,
        paymentMethod: 'VISA',
        paymentIntentId: paymentIntentId
      };
      
      const paymentResponse = await axios.post(
        `${API_URL}/api/payments/process-intent`,
        paymentRequest,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Payment processed with response:', paymentResponse.data);
      
      // If payment was successful, create the order
      if (paymentResponse.data && paymentResponse.data.successful) {
        console.log('Payment was successful, creating order with payment linkage');
        
        // Determine which address to use
        let addressToUse;
        
        if (selectedAddress === 'temp' && tempAddress) {
          // Use the temporary address
          addressToUse = tempAddress;
        } else {
          // Find the selected address from saved addresses
          addressToUse = addresses.find(addr => addr.id === selectedAddress)?.rawData || null;
        }
        
        if (!addressToUse) {
          Alert.alert("Error", "Please provide a delivery address");
          setProcessingPayment(false);
          return;
        }
        
        // Create an address request object that matches the backend expectation
        const addressRequest = {
          rue: addressToUse.rue || "",
          numero: addressToUse.numero || "",
          indication: addressToUse.indication || "",
          nomVille: addressToUse.ville || "",
          nomPays: addressToUse.pays || ""
        };
        
        // Format pack array to match PackSellingRequest structure
        const packs = [{
          id_Pack: packId,
          quantite: quantity
        }];
        
        // Create order payload with payment intent ID
        const orderPayload = {
          clientId: user.id,
          addressRequest: addressRequest,
          packs: packs,
          paymentType: 'EnLigne',
          paymentIntentId: paymentIntentId
        };
        
        console.log('Creating pack order with payload:', orderPayload);
        
        // Make API call to create order
        const orderResponse = await axios.post(
          `${API_URL}/api/commandes/${user.id}/Pack`,
          orderPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Order created with response:', orderResponse.data);
        
        // Close modals
        setPaymentModalVisible(false);
        
        // Extract order data from response
        // The response shape might look like:
        // {
        //   idCommande: "cmd_12345",
        //   total: 299.99,
        //   orderDate: "2023-04-24T10:15:30Z",
        //   status: "PayeEtEnCoursDeTraitement",
        //   paymentType: "EnLigne",
        //   client: { id: "123", name: "John Doe" },
        //   addressLivraison: { ... },
        //   products: [ ... ],
        //   packs: [ ... ],
        //   payment: {
        //     paymentId: "pay_12345",
        //     amount: 299.99,
        //     timestamp: "2023-04-24T10:15:30Z",
        //     transactionReference: "txn_12345",
        //     paymentIntentId: "pi_12345",
        //     receiptUrl: "https://..."
        //   }
        // }
        
        // Prepare data for PaymentSuccess screen
        // Make sure we extract all possible properties and provide fallbacks
        const orderData = orderResponse.data;
        
        // Navigate to payment success screen with properly structured data
        navigation.navigate('PaymentSuccess', {
          order: {
            idCommande: orderData.idCommande,
            id: orderData.idCommande, // Duplicating for components that look for id
            total: orderData.total || totalAmount,
            orderDate: orderData.orderDate || new Date().toISOString(),
            status: orderData.status || "PayeEtEnCoursDeTraitement",
            paymentType: orderData.paymentType || "EnLigne"
          },
          // Use payment data from the order response if available, otherwise use the payment processor response
          payment: orderData.payment || paymentResponse.data
        });
      } else {
        // Payment failed
        Alert.alert(
          "Payment Failed", 
          paymentResponse.data?.errorMessage || "Your payment could not be processed. Please try again with a different card."
        );
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert(
        "Payment Error", 
        error.response?.data?.message || "There was a problem processing your payment. Please try again later."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDirectOrder = async () => {
    if (!selectedAddress && !tempAddress) {
      Alert.alert("Error", "Please select or add a delivery address");
      return;
    }
  
    try {
      setProcessingOrder(true);
      
      // Determine which address to use
      let addressToUse;
      
      if (selectedAddress === 'temp' && tempAddress) {
        // Use the temporary address
        addressToUse = tempAddress;
      } else {
        // Find the selected address from saved addresses
        addressToUse = addresses.find(addr => addr.id === selectedAddress)?.rawData || null;
      }
      
      if (!addressToUse) {
        Alert.alert("Error", "Please provide a delivery address");
        setProcessingOrder(false);
        return;
      }
      
      // Create an address request object that matches the backend expectation
      const addressRequest = {
        rue: addressToUse.rue || "",
        numero: addressToUse.numero || "",
        indication: addressToUse.indication || "",
        nomVille: addressToUse.ville || "",
        nomPays: addressToUse.pays || ""
      };
      
      // Format pack array to match PackSellingRequest structure
      const packs = [{
        id_Pack: packId,
        quantite: quantity
      }];
      
      // Create order payload matching CreateCommandeRequest structure
      const orderPayload = {
        clientId: user.id,
        addressRequest: addressRequest,
        packs: packs,
        paymentType: paymentType
      };
      
      console.log('Creating pack order with payload:', orderPayload);
      
      // Make API call to create order
      const response = await axios.post(
        `${API_URL}/api/commandes/${user.id}/Pack`,
        orderPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Order created:', response.data);
      
      // Close modal
      setOrderModalVisible(false);
      
      // For cash on delivery, show success alert
      if (paymentType === 'Livraison') {
        Alert.alert(
          "Order Placed Successfully",
          `Your order for ${quantity} ${quantity > 1 ? 'packs' : 'pack'} has been placed. You will pay upon delivery.`,
          [
            { 
              text: "View Order Details", 
              onPress: () => navigation.navigate('OrderDetails', { orderId: response.data.idCommande }) 
            },
            { 
              text: "OK", 
              style: "default"
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert(
        "Order Failed", 
        error.response?.data?.message || "Failed to place your order. Please try again."
      );
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <ScreenComponent style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <Header label="Pack Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo size={16} style={styles.loadingText}>Loading pack details...</Typo>
        </View>
      </ScreenComponent>
    );
  }

  if (error) {
    return (
      <ScreenComponent style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <Header label="Pack Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Entypo name="warning" size={50} color={colors.danger} style={styles.errorIcon} />
          <Text style={styles.errorText}>Error loading pack details</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPackDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenComponent>
    );
  }

  if (!pack) {
    return (
      <ScreenComponent style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <Header label="Pack Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Entypo name="emoji-sad" size={50} color={colors.darkGray} style={styles.errorIcon} />
          <Text style={styles.errorText}>Pack not found</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenComponent>
    );
  }

  const totalValue = pack.products && pack.products.reduce(
    (total, item) => total + (item.unitPrice * item.quantity), 
    0
  );
  
  const savings = totalValue - pack.price;
  const savingsPercentage = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

  // Calculate final price with quantity
  const subtotal = pack.price * quantity;
  const total = subtotal + shippingFee;

  return (
    <ScreenComponent style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <Header 
        label="Pack Details" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.heartButton}>
            <AntDesign name="hearto" size={24} color={colors.dark} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Card container for entire content */}
        <Animated.View 
          entering={FadeIn.delay(100).duration(800)}
          style={styles.mainCard}
        >
          {/* Product Title and Save Badge */}
          <View style={styles.titleContainer}>
            <Typo size={24} weight="bold" style={styles.packName}>{pack.name || "Pack"}</Typo>
            
            {savings > 0 && (
              <View style={styles.savingsBadge}>
                <Typo size={14} weight="bold" style={styles.savingsText}>
                  Save {savingsPercentage}%
                </Typo>
              </View>
            )}
          </View>

          {/* Price Display */}
          <View style={styles.priceContainer}>
            <Typo size={28} weight="bold" style={styles.packPrice}>
              {(pack.price || 1451.99).toFixed(2)} TND
            </Typo>
            {totalValue > 0 && (
              <Typo size={16} style={styles.originalPrice}>
                {(totalValue || 3564.92).toFixed(2)} TND
              </Typo>
            )}
          </View>

          {/* Availability Status */}
          <View style={styles.availabilityContainer}>
            <Typo 
              size={16} 
              weight="medium" 
              style={[
                styles.availabilityText,
                (!pack.disponibility || (pack.stock !== undefined && pack.stock <= 0)) ? 
                  styles.outOfStockText : 
                  styles.inStockText
              ]}
            >
              {(!pack.disponibility || (pack.stock !== undefined && pack.stock <= 0)) ? 
                'Out of Stock' : 
                'In Stock'}
            </Typo>
          </View>

          {/* Image Gallery */}
          <View style={styles.imageContainer}>
            {pack.photos && pack.photos.length > 0 ? (
              <>
                <Image
                  source={{ uri: `${API_URL}/uploads/${pack.photos[selectedPhotoIndex]}` }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
                
                {pack.photos.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.thumbnailsContainer}
                    contentContainerStyle={styles.thumbnailsContentContainer}
                  >
                    {pack.photos.map((photo, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedPhotoIndex(index)}
                        style={[
                          styles.thumbnailButton,
                          selectedPhotoIndex === index && styles.selectedThumbnail
                        ]}
                      >
                        <Image
                          source={{ uri: `${API_URL}/uploads/${photo}` }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={[styles.mainImage, styles.noImage]}>
                <Entypo name="image" size={50} color={colors.gray} />
                <Typo size={16} style={styles.noImageText}>No image available</Typo>
              </View>
            )}
          </View>

          {/* Products List */}
          <View style={styles.sectionContainer}>
            <Typo size={20} weight="semibold" style={styles.sectionTitle}>
              Products Included
            </Typo>
            
            {pack.products && pack.products.map((product, index) => (
              <Animated.View
                key={product.id || index}
                entering={SlideInRight.delay(300 + index * 100).duration(800)}
                style={styles.productItem}
              >
                <View style={styles.productImageContainer}>
                  <View style={styles.productImage}>
                    <Entypo name="box" size={24} color={colors.darkGray} />
                  </View>
                </View>
                <View style={styles.productInfo}>
                  <Typo size={16} weight="medium" style={styles.productName}>{product.name}</Typo>
                  <Typo size={14} style={styles.productQuantity}>
                    {product.quantity} {product.quantity === 1 ? 'unit' : 'units'}
                  </Typo>
                </View>
                <View style={styles.productPricing}>
                  <Typo size={14} style={styles.unitPrice}>
                    {product.unitPrice?.toFixed(2)} TND/unit
                  </Typo>
                  <Typo size={16} weight="semibold" style={styles.productTotal}>
                    {(product.unitPrice * product.quantity)?.toFixed(2)} TND
                  </Typo>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Total Value */}
          <View style={styles.totalValueContainer}>
            <View style={styles.valueRow}>
              <Typo size={16}>Total Value:</Typo>
              <Typo size={16} weight="semibold">{totalValue?.toFixed(2)} TND</Typo>
            </View>
            <View style={styles.valueRow}>
              <Typo size={16}>Pack Price:</Typo>
              <Typo size={16} weight="semibold" style={styles.packPriceTotal}>
                {pack.price?.toFixed(2)} TND
              </Typo>
            </View>
            {savings > 0 && (
              <View style={styles.valueRow}>
                <Typo size={16}>Your Savings:</Typo>
                <Typo size={16} weight="semibold" style={styles.savingsAmount}>
                  {savings?.toFixed(2)} TND ({savingsPercentage}%)
                </Typo>
              </View>
            )}
          </View>

          {/* Description Section */}
          <View style={styles.sectionContainer}>
            <Typo size={20} weight="semibold" style={styles.sectionTitle}>
              Description
            </Typo>
            <Typo size={16} style={styles.descriptionText}>
              {pack.description || "This pack contains all the essential products you need at a discounted price. Take advantage of this special offer while stocks last."}
            </Typo>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Order Now Button */}
      {pack.disponibility && (
        <Animated.View 
          entering={FadeInDown.delay(500).duration(800)}
          style={styles.bottomBar}
        >
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]} 
              onPress={decrementQuantity}
              disabled={quantity <= 1}
            >
              <AntDesign name="minus" size={16} color={quantity <= 1 ? colors.gray : colors.dark} />
            </TouchableOpacity>
            <View style={styles.quantityValue}>
              <Typo size={16} weight="semibold">{quantity}</Typo>
            </View>
            <TouchableOpacity 
              style={[
                styles.quantityButton, 
                (pack && quantity >= pack.stock) && styles.quantityButtonDisabled
              ]} 
              onPress={incrementQuantity}
              disabled={pack && quantity >= pack.stock}
            >
              <AntDesign name="plus" size={16} color={(pack && quantity >= pack.stock) ? colors.gray : colors.dark} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.orderButton}
            onPress={handleAddToCart}
            disabled={!pack.disponibility}
          >
            <Ionicons name="bag-check-outline" size={22} color={colors.white} />
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typo size={20} weight="bold" style={styles.modalTitle}>Complete Your Order</Typo>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Summary */}
              <View style={styles.orderSummaryContainer}>
                <Typo size={18} weight="semibold" style={styles.orderSummaryTitle}>Order Summary</Typo>
                <View style={styles.orderItem}>
                  <Typo size={16}>{pack.name}</Typo>
                  <View style={styles.orderItemQuantity}>
                    <Typo size={16}>x {quantity}</Typo>
                    <Typo size={16} weight="semibold" style={styles.orderItemPrice}>
                      {(pack.price * quantity).toFixed(2)} TND
                    </Typo>
                  </View>
                </View>
                <View style={styles.orderRow}>
                  <Typo size={16}>Shipping Fee</Typo>
                  <Typo size={16} weight="semibold">
                    {shippingFee.toFixed(2)} TND
                  </Typo>
                </View>
                <View style={styles.orderTotalRow}>
                  <Typo size={18} weight="bold">Total:</Typo>
                  <Typo size={18} weight="bold" style={styles.orderTotal}>
                    {total.toFixed(2)} TND
                  </Typo>
                </View>
              </View>

              {/* Delivery Address */}
              <Typo size={18} weight="semibold" style={styles.sectionHeader}>Delivery Address</Typo>
              
              {/* Option to add a one-time delivery address */}
              <TouchableOpacity 
                style={[
                  styles.addressOption, 
                  selectedAddress === 'temp' && styles.selectedAddressOption
                ]}
                onPress={() => {
                  if (tempAddress) {
                    setSelectedAddress('temp');
                  } else {
                    handleAddDeliveryAddress();
                  }
                }}
              >
                <View style={[
                  styles.radioButton, 
                  { borderColor: selectedAddress === 'temp' ? colors.primary : colors.lightGray }
                ]}>
                  {selectedAddress === 'temp' && <View style={styles.radioButtonDot} />}
                </View>
                
                <View style={{ flex: 1 }}>
                  <Typo size={16} weight="medium">
                    {tempAddress ? 'Delivery Address' : 'Add Delivery Address'}
                  </Typo>
                  
                  {tempAddress ? (
                    <>
                      <Typo size={14} style={{ color: colors.gray, marginTop: 4 }}>
                        {`${tempAddress.rue || ''}, ${tempAddress.numero || ''}`}
                      </Typo>
                      <Typo size={14} style={{ color: colors.gray }}>
                        {`${tempAddress.ville || ''}, ${tempAddress.pays || ''}`}
                      </Typo>
                    </>
                  ) : (
                    <Typo size={14} style={{ color: colors.gray, marginTop: 4 }}>
                      Use a different address for this delivery
                    </Typo>
                  )}
                </View>
                
                <TouchableOpacity onPress={handleAddDeliveryAddress}>
                  <MaterialIcons 
                    name={tempAddress ? "edit" : "add-circle-outline"} 
                    size={24} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Saved addresses */}
              {addresses.length > 0 && addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressOption,
                    selectedAddress === addr.id && styles.selectedAddressOption
                  ]}
                  onPress={() => setSelectedAddress(addr.id)}
                >
                  <View style={[
                    styles.radioButton,
                    { borderColor: selectedAddress === addr.id ? colors.primary : colors.lightGray }
                  ]}>
                    {selectedAddress === addr.id && <View style={styles.radioButtonDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typo size={16} weight="medium">{addr.title}</Typo>
                    <Typo size={14} style={{ color: colors.gray }}>{addr.address}</Typo>
                    {addr.isDefault && (
                      <Typo size={14} style={{ color: colors.primary }}>Default Address</Typo>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Payment Method */}
              <Typo size={18} weight="semibold" style={styles.sectionHeader}>Payment Method</Typo>
              
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === 'EnLigne' && styles.selectedPaymentOption
                ]}
                onPress={() => setPaymentType('EnLigne')}
              >
                <View style={[
                  styles.radioButton,
                  { borderColor: paymentType === 'EnLigne' ? colors.primary : colors.lightGray }
                ]}>
                  {paymentType === 'EnLigne' && <View style={styles.radioButtonDot} />}
                </View>
                <View style={styles.paymentIconContainer}>
                  <MaterialIcons name="credit-card" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={16} weight="medium">Pay Online</Typo>
                  <Typo size={14} style={{ color: colors.gray }}>
                    Pay now with credit card
                  </Typo>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === 'Livraison' && styles.selectedPaymentOption
                ]}
                onPress={() => setPaymentType('Livraison')}
              >
                <View style={[
                  styles.radioButton,
                  { borderColor: paymentType === 'Livraison' ? colors.primary : colors.lightGray }
                ]}>
                  {paymentType === 'Livraison' && <View style={styles.radioButtonDot} />}
                </View>
                <View style={styles.paymentIconContainer}>
                  <MaterialIcons name="local-shipping" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={16} weight="medium">Cash on Delivery</Typo>
                  <Typo size={14} style={{ color: colors.gray }}>
                    Pay when your order arrives
                  </Typo>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <AppButton 
              label={processingOrder ? "Processing..." : "Continue"}
              onPress={proceedToPayment}
              disabled={processingOrder || (!selectedAddress && !tempAddress)}
              style={styles.placeOrderButton}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typo size={20} weight="bold" style={styles.modalTitle}>Payment Details</Typo>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Card Details Form */}
              <View style={styles.cardContainer}>
                <View style={styles.inputContainer}>
                  <Typo size={14} style={styles.label}>Card Number</Typo>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    maxLength={19} // 16 digits + 3 spaces
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Typo size={14} style={styles.label}>Cardholder Name</Typo>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                  />
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: spacingX._10 }]}>
                    <Typo size={14} style={styles.label}>Expiry Date</Typo>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                      maxLength={5} // MM/YY format
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Typo size={14} style={styles.label}>CVV</Typo>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      value={cvv}
                      onChangeText={setCvv}
                      maxLength={4}
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              {/* Payment Summary */}
              <View style={styles.paymentSummary}>
                <Typo size={18} style={{ fontWeight: '600', marginBottom: spacingY._15 }}>
                  Payment Summary
                </Typo>
                
                <View style={styles.summaryRow}>
                  <Typo size={14}>Subtotal</Typo>
                  <Typo size={16}>
                    {subtotal.toFixed(2)} TND
                  </Typo>
                </View>
                
                <View style={styles.summaryRow}>
                  <Typo size={14}>Shipping Fee</Typo>
                  <Typo size={16}>
                    {shippingFee.toFixed(2)} TND
                  </Typo>
                </View>
                
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Typo size={16} style={{ fontWeight: '600' }}>Total Payment</Typo>
                  <Typo size={18} style={{ fontWeight: '700', color: colors.primary }}>
                    {total.toFixed(2)} TND
                  </Typo>
                </View>
              </View>
            </ScrollView>

            <AppButton 
              label={processingPayment ? "Processing..." : "Pay Now"}
              onPress={handlePayment}
              disabled={processingPayment}
              style={styles.payButton}
            />
          </View>
        </View>
      </Modal>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80,
  },
  mainCard: {
    margin: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packName: {
    color: colors.dark,
    flex: 1,
  },
  savingsBadge: {
    backgroundColor: '#dc2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 10,
  },
  savingsText: {
    color: colors.white,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  packPrice: {
    color: colors.orange,
    marginRight: 12,
  },
  originalPrice: {
    color: colors.darkGray,
    textDecorationLine: 'line-through',
    marginBottom: 3,
  },
  availabilityContainer: {
    marginBottom: 20,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inStockText: {
    color: colors.green,
  },
  outOfStockText: {
    color: colors.danger,
  },
  imageContainer: {
    marginBottom: 24,
  },
  mainImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  noImage: {
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 10,
    color: colors.gray,
  },
  thumbnailsContainer: {
    marginTop: 12,
  },
  thumbnailsContentContainer: {
    paddingHorizontal: 5,
  },
  thumbnailButton: {
    width: 65,
    height: 65,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: colors.dark,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.lighterGray,
    marginBottom: 12,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    marginBottom: 4,
  },
  productQuantity: {
    color: colors.darkGray,
  },
  productPricing: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    color: colors.darkGray,
    marginBottom: 4,
  },
  productTotal: {
    color: colors.orange,
  },
  totalValueContainer: {
    backgroundColor: colors.lighterGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  packPriceTotal: {
    color: colors.orange,
  },
  savingsAmount: {
    color: colors.success,
  },
  descriptionText: {
    color: colors.darkGray,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorMessage: {
    color: colors.darkGray,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 2,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  goBackButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 2,
    marginTop: 15,
  },
  goBackButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  heartButton: {
    padding: 5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lighterGray,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  orderButton: {
    flex: 1,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  orderButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.dark,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.dark,
  },
  orderSummaryContainer: {
    backgroundColor: colors.lighterGray,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  orderSummaryTitle: {
    marginBottom: 10,
  },
  orderItem: {
    marginBottom: 10,
  },
  orderItemQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  orderItemPrice: {
    color: colors.orange,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lighterGray,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginTop: 10,
  },
  orderTotal: {
    color: colors.orange,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedAddressOption: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lightGray,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedPaymentOption: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeOrderButton: {
    marginTop: 20,
  },
  // Card Input styles
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    borderWidth: 1,
    borderColor: colors.lighterGray,
  },
  inputContainer: {
    marginBottom: spacingY._15,
  },
  label: {
    color: colors.gray,
    marginBottom: spacingY._5,
  },
  input: {
    height: 50,
    backgroundColor: colors.lighterGray,
    borderRadius: radius._10,
    paddingHorizontal: spacingX._15,
    fontSize: normalizeY(14),
  },
  row: {
    flexDirection: 'row',
  },
  paymentSummary: {
    backgroundColor: colors.lighterGray,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginTop: 8,
    paddingTop: 10,
  },
  payButton: {
    marginTop: 15,
  }
});

export default PackDetailsScreen;