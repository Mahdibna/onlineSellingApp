import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import useAuth from 'auth/useAuth';
import colors from 'config/colors';


const MyOrdersScreen = () => {
  const [orders, setOrders] = useState({ ongoing: [], completed: [] });
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { token } = useAuth();
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/clients/profile/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Orders response:', response.data);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchOrders();
      }
    }, [token])
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Livree':
      case 'LivreeEtPaye':
        return '#00B37A'; // Green for delivered
      case 'Annulee':
        return '#FF3B30'; // Red for cancelled
      case 'EnCoursDeTraitement':
      case 'PayeEtEnCoursDeTraitement':
        return '#FF9500'; // Orange for processing
      case 'EnTransit':
        return '#007AFF'; // Blue for transit
      case 'EnCoursDeLivraison':
        return '#5856D6'; // Purple for out for delivery
      case 'EnRetour':
        return colors.primary; // Primary color for return
      default:
        return '#8E8E93'; // Gray for other statuses
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'Livree':
        return 'Delivered';
      case 'LivreeEtPaye':
        return 'Delivered & Paid';
      case 'Annulee':
        return 'Cancelled';
      case 'EnCoursDeTraitement':
        return 'Processing';
      case 'PayeEtEnCoursDeTraitement':
        return 'Paid & Processing';
      case 'EnTransit':
        return 'In Transit';
      case 'EnCoursDeLivraison':
        return 'Out for Delivery';
      case 'EnRetour':
        return 'Return in Progress';
      default:
        return status;
    }
  };

  const translatePaymentType = (paymentType) => {
    switch (paymentType) {
      case 'EnLigne':
        return 'Online';
      case 'Livraison':
        return 'On Delivery';
      default:
        return paymentType;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.orderId}</Text>
        <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
      </View>
      
      <View style={styles.orderTypeContainer}>
        <Text style={styles.orderType}>{item.orderType === 'Produit' ? 'Product' : 'Pack'} Order</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{translateStatus(item.status)}</Text>
        </View>
      </View>
      
      {/* Payment Type Information */}
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentType}>
          <Ionicons name="wallet-outline" size={14} color="#666666" />
          {' '}Payment: {translatePaymentType(item.paymentType)}
        </Text>
      </View>
      
      <Text style={styles.orderTotal}>Total: {item.total?.toFixed(2) || "0.00"} TND</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
        >
          <Ionicons name="eye" size={18} color={colors.primary} />
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchOrders}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>MY ORDERS</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ongoing' && styles.activeTab
          ]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'ongoing' && styles.activeTabText
          ]}>
            Ongoing
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && styles.activeTab
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'completed' && styles.activeTabText
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={activeTab === 'ongoing' ? orders.ongoing : orders.completed}
        renderItem={renderOrderItem}
        keyExtractor={item => item.orderId.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="remove-shopping-cart" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeTab === 'ongoing' 
                ? 'No ongoing orders found' 
                : 'No completed orders found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#666666',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#666666',
    marginTop: 10,
    fontSize: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderDate: {
    color: '#666666',
  },
  orderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderType: {
    color: '#666666',
  },
  paymentInfo: {
    marginBottom: 5,
  },
  paymentType: {
    color: '#666666',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  orderTotal: {
    fontWeight: '600',
    fontSize: 16,
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 5,
    padding: 10,
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MyOrdersScreen;