import { MaterialIcons } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { normalizeX, normalizeY } from 'utils/normalize';
import axios from 'axios';
import useAuth from 'auth/useAuth';
import { trackMultiplePurchases } from '../utils/RecommendationUtils';

// Components
import AppButton from 'components/AppButton';
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';

// Config
import colors from 'config/colors';
import { height, radius, spacingX, spacingY } from 'config/spacing';


function CheckoutScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { cartItems, cartTotal } = route.params || { cartItems: [], cartTotal: 0 };

  const [paymentType, setPaymentType] = useState('EnLigne');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingFee, setShippingFee] = useState(30);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [tempAddress, setTempAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Credit Card');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
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
        const formattedAddress = {
          id: addressData.id || 'default',
          title: 'Default Address',
          phone: userPhone,
          address: `${addressData.rue || ''}, ${addressData.numero || ''}, ${addressData.ville || ''}`.trim(),
          rawData: addressData,
          isDefault: true,
        };
        setAddresses([formattedAddress]);
        setSelectedAddress(formattedAddress.id);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load your addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryAddress = () => {
    navigation.navigate('AddDeliveryAddress', {
      onSave: (newAddress) => {
        setTempAddress(newAddress);
        setSelectedAddress('temp');
      },
      existingAddress: tempAddress,
    });
  };

  useEffect(() => {
    if (paymentType === 'EnLigne') {
      setSelectedPaymentMethod('Credit Card');
    } else {
      setSelectedPaymentMethod(null);
    }
  }, [paymentType]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    try {
      setProcessingOrder(true);

      let addressToUse;
      if (selectedAddress === 'temp' && tempAddress) {
        addressToUse = tempAddress;
      } else {
        addressToUse = addresses.find((addr) => addr.id === selectedAddress)?.rawData || null;
      }

      if (!addressToUse) {
        Alert.alert('Error', 'Please provide a delivery address');
        setProcessingOrder(false);
        return;
      }

      const formattedProducts = cartItems.map((item) => ({
        id_product: item.id,
        quantité: item.quantity,
      }));

      if (paymentType === 'EnLigne') {
        if (!selectedPaymentMethod) {
          Alert.alert('Error', 'Please select a payment method');
          setProcessingOrder(false);
          return;
        }

        setProcessingOrder(false);

        navigation.navigate('Payment', {
          cartItems: formattedProducts,
          cartTotal: cartTotal,
          shippingFee: shippingFee,
          totalAmount: cartTotal + shippingFee,
          addressToUse: addressToUse,
          userId: user.id,
          paymentMethod: selectedPaymentMethod,
        });
      } else {
        const orderPayload = {
          address: addressToUse,
          products: formattedProducts,
          paymentType: paymentType,
        };

        console.log('Creating order with payload:', orderPayload);

        const response = await axios.post(`${API_URL}/api/commandes/${user.id}`, orderPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Order created:', response.data);

        await trackMultiplePurchases(user.id, formattedProducts);

        Alert.alert(
          'Order Placed Successfully',
          'Your order has been placed. You will pay upon delivery.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('MyOrders');
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                }, 1000);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error in checkout process:', error);
      Alert.alert('Process Failed', error.response?.data?.message || 'Failed to process your order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <ScreenComponent style={styles.container}>
      <Header label={'Checkout'} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, padding: spacingX._20 }}
            contentContainerStyle={{ paddingBottom: '10%' }}
          >
            <Typo size={18} style={{ fontWeight: '600', marginBottom: spacingY._15 }}>
              Delivery Address
            </Typo>

            <TouchableOpacity
              style={[styles.addressOption, selectedAddress === 'temp' && styles.selectedOption]}
              onPress={() => {
                if (tempAddress) {
                  setSelectedAddress('temp');
                } else {
                  handleAddDeliveryAddress();
                }
              }}
            >
              <View
                style={[styles.dotRadius, { borderColor: selectedAddress === 'temp' ? colors.primary : colors.lightGray }]}
              >
                {selectedAddress === 'temp' && <View style={styles.dot} />}
              </View>

              <View style={{ flex: 1 }}>
                <Typo size={16} style={{ fontWeight: '500' }}>
                  {tempAddress ? 'Delivery Address' : 'Add Delivery Address'}
                </Typo>

                {tempAddress ? (
                  <>
                    <Typo size={12} style={{ color: colors.gray, marginTop: spacingY._5 }}>
                      {`${tempAddress.rue || ''}, ${tempAddress.numero || ''}`}
                    </Typo>
                    <Typo size={12} style={{ color: colors.gray }}>
                      {`${tempAddress.ville || ''}, ${tempAddress.pays || ''}`}
                    </Typo>
                    <Typo size={12} style={{ color: colors.primary, marginTop: spacingY._5 }}>
                      One-time delivery address
                    </Typo>
                  </>
                ) : (
                  <Typo size={12} style={{ color: colors.gray, marginTop: spacingY._5 }}>
                    Use a different address for this delivery only
                  </Typo>
                )}
              </View>
              <TouchableOpacity onPress={handleAddDeliveryAddress}>
                <MaterialIcons name={tempAddress ? 'edit' : 'add-circle-outline'} size={24} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>

            {addresses.length > 0 &&
              addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  selected={selectedAddress === addr.id}
                  setSelected={() => setSelectedAddress(addr.id)}
                  title={addr.title}
                  phone={addr.phone}
                  address={addr.address}
                  isDefault={addr.isDefault}
                />
              ))}

            <Typo size={18} style={{ fontWeight: '600', marginTop: spacingY._25, marginBottom: spacingY._15 }}>
              Payment Method
            </Typo>

            <View style={styles.paymentTypeContainer}>
              <PaymentTypeOption
                title="En ligne"
                description="Pay now with credit card"
                icon="credit-card"
                selected={paymentType === 'EnLigne'}
                onSelect={() => setPaymentType('EnLigne')}
              />

              <PaymentTypeOption
                title="À la livraison"
                description="Pay cash when your order arrives"
                icon="local-shipping"
                selected={paymentType === 'Livraison'}
                onSelect={() => setPaymentType('Livraison')}
              />
            </View>

            {paymentType === 'EnLigne' && (
              <View style={styles.onlineMethodsContainer}>
                <Typo size={16} style={{ fontWeight: '500', marginTop: spacingY._15, marginBottom: spacingY._10 }}>
                  Online Payment Options
                </Typo>

                <MethodRow
                  title={'Credit Card'}
                  selected={selectedPaymentMethod}
                  setSelected={setSelectedPaymentMethod}
                  img={require('../assets/visa.png')}
                />
                <MethodRow
                  title={'PayPal'}
                  selected={selectedPaymentMethod}
                  setSelected={setSelectedPaymentMethod}
                  img={require('../assets/paypal.png')}
                />
                <MethodRow
                  title={'Google Pay'}
                  selected={selectedPaymentMethod}
                  setSelected={setSelectedPaymentMethod}
                  img={require('../assets/google.png')}
                />
                <MethodRow
                  title={'Apple Pay'}
                  selected={selectedPaymentMethod}
                  setSelected={setSelectedPaymentMethod}
                  img={require('../assets/apple.png')}
                />
              </View>
            )}

            {cartItems.length > 0 && (
              <View style={styles.orderSummary}>
                <Typo size={16} style={{ fontWeight: '600', marginBottom: spacingY._10 }}>
                  Order Summary
                </Typo>
                {cartItems.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <Typo size={14} style={{ flex: 1 }}>
                      {item.name} x{item.quantity}
                    </Typo>
                    <Typo size={14} style={{ fontWeight: '500' }}>
                      {(item.price * item.quantity).toFixed(2)} TND
                    </Typo>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.checkoutContainer}>
            <Row title={'Shipping fee'} price={`${shippingFee.toFixed(2)} TND`} />
            <View style={styles.separator} />
            <Row title={'Subtotal'} price={`${cartTotal.toFixed(2)} TND`} />
            <View style={styles.separator} />
            <Row title={'Total'} price={`${(cartTotal + shippingFee).toFixed(2)} TND`} />
            <AppButton
              label={processingOrder ? 'Processing...' : paymentType === 'EnLigne' ? 'Proceed to Payment' : 'Place Order'}
              onPress={handlePlaceOrder}
              disabled={processingOrder || !selectedAddress}
            />
          </View>
        </>
      )}
    </ScreenComponent>
  );
}

const PaymentTypeOption = ({ title, description, icon, selected, onSelect }) => {
  return (
    <TouchableOpacity style={[styles.paymentTypeOption, selected && styles.selectedPaymentType]} onPress={onSelect}>
      <View style={[styles.checkboxContainer, { borderColor: selected ? colors.primary : colors.lightGray }]}>
        {selected && <View style={styles.checkbox} />}
      </View>

      <View style={styles.paymentTypeIconContainer}>
        <MaterialIcons name={icon} size={24} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Typo size={16} style={{ fontWeight: '500' }}>
          {title}
        </Typo>
        <Typo size={12} style={{ color: colors.gray, marginTop: spacingY._3 }}>
          {description}
        </Typo>
      </View>
    </TouchableOpacity>
  );
};

const Row = ({ title, price }) => {
  return (
    <View style={styles.row}>
      <Typo size={15} style={{ color: title === 'Total' ? colors.black : colors.gray, fontWeight: '500' }}>
        {title}
      </Typo>
      <Typo size={18} style={{ fontWeight: '600' }}>
        {price}
      </Typo>
    </View>
  );
};

const MethodRow = ({ title, img, selected, setSelected }) => {
  const isSelected = selected === title;
  return (
    <TouchableOpacity style={styles.row} onPress={() => setSelected(title)}>
      <View style={styles.methodImgBg}>
        <Image source={img} style={styles.methodImg} />
      </View>
      <Typo size={15} style={{ color: colors.black, fontWeight: '500', flex: 1 }}>
        {title}
      </Typo>
      <View>
        <View style={[styles.dotRadius, { borderColor: isSelected ? colors.primary : colors.lightGray }]}>
          {isSelected && <View style={styles.dot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};
const AddressCard = ({ title, selected, setSelected, address, phone, isDefault }) => {
  return (
    <TouchableOpacity style={selected ? styles.selectedCard : styles.unSelectedCard} onPress={setSelected}>
      <View style={[styles.dotRadius, { borderColor: selected ? colors.primary : colors.lightGray }]}>
        {selected && <View style={styles.dot} />}
      </View>
      <View style={{ flex: 1, gap: spacingY._5 }}>
        <Typo size={16} style={{ fontWeight: '500' }}>
          {title}
        </Typo>
        <Typo size={12} style={{ color: colors.gray }}>
          {phone}
        </Typo>
        <Typo size={12} style={{ color: colors.gray }}>
          {address}
        </Typo>
        {isDefault && (
          <Typo size={12} style={{ color: colors.primary }}>
            Default address
          </Typo>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grayBG,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutContainer: {
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    shadowColor: colors.black,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.2,
    backgroundColor: colors.white,
    paddingTop: spacingY._20,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
  },
  row: {
    height: height.input,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: colors.grayBG,
    alignItems: 'center',
    gap: spacingX._10,
    marginTop: spacingY._10,
  },
  methodImgBg: {
    backgroundColor: colors.white,
    borderWidth: 1,
    padding: spacingY._7,
    borderRadius: radius._30,
    borderColor: colors.lighterGray,
  },
  methodImg: {
    height: normalizeY(30),
    width: normalizeY(30),
    resizeMode: 'contain',
  },
  separator: {
    height: normalizeY(2),
    width: '100%',
    backgroundColor: colors.grayBG,
  },
  dotRadius: {
    borderWidth: normalizeY(2),
    borderRadius: radius._20,
    borderColor: colors.primary,
    height: normalizeY(20),
    width: normalizeY(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: normalizeY(11),
    width: normalizeY(11),
    borderRadius: radius._10,
    backgroundColor: colors.primary,
  },
  selectedCard: {
    backgroundColor: colors.white,
    gap: spacingX._10,
    flexDirection: 'row',
    padding: spacingY._15,
    borderRadius: radius._20,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
  },
  unSelectedCard: {
    backgroundColor: colors.lighterGray,
    gap: spacingX._10,
    flexDirection: 'row',
    padding: spacingY._15,
    borderRadius: radius._20,
    marginBottom: spacingY._15,
  },
  addressOption: {
    backgroundColor: colors.lighterGray,
    gap: spacingX._10,
    flexDirection: 'row',
    padding: spacingY._15,
    borderRadius: radius._20,
    marginBottom: spacingY._15,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  orderSummary: {
    backgroundColor: colors.white,
    borderRadius: radius._20,
    padding: spacingY._15,
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacingY._8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  paymentTypeContainer: {
    marginBottom: spacingY._15,
  },
  paymentTypeOption: {
    backgroundColor: colors.lighterGray,
    flexDirection: 'row',
    padding: spacingY._15,
    borderRadius: radius._15,
    marginBottom: spacingY._10,
    alignItems: 'center',
    gap: spacingX._10,
  },
  selectedPaymentType: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  checkboxContainer: {
    borderWidth: 2,
    borderRadius: 5,
    height: normalizeY(20),
    width: normalizeY(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    height: normalizeY(12),
    width: normalizeY(12),
    backgroundColor: colors.primary,
  },
  paymentTypeIconContainer: {
    backgroundColor: colors.white,
    padding: spacingY._8,
    borderRadius: radius._10,
    borderWidth: 1,
    borderColor: colors.lighterGray,
  },
  onlineMethodsContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
  },
});

export default CheckoutScreen;