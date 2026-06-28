import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { useFocusEffect } from '@react-navigation/native';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import useAuth from 'auth/useAuth';


function ComplaintsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { label: 'PENDING', value: 'EnAttente', color: '#FFA500' },
    { label: 'IN PROGRESS', value: 'EnCoursDeTraitement', color: '#3498DB' },
    { label: 'RESOLVED', value: 'Résolue', color: '#2ECC71' },
    { label: 'REJECTED', value: 'Rejetée', color: '#E74C3C' },
    { label: 'Closed', value: 'Fermée', color: '#95A5A6' },
  ];

  const fetchMyComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/reclamations/my-reclamations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Complaints response:', response.data);
      
      // Ensure we always have an array
      const data = Array.isArray(response?.data) ? response.data : [];
      setComplaints(data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints. Please try again.');
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchMyComplaints();
      }
    }, [fetchMyComplaints, token])
  );

  const handleViewDetails = (complaint) => {
    navigation.navigate('ComplaintDetails', { 
      complaintId: complaint.idReclamation,
      complaint: complaint
    });
  };

  const getStatusColor = (status) => {
    // First try to find a match in statusOptions
    const statusOption = statusOptions.find(option => 
      option.label === status || option.value === status
    );
    
    if (statusOption) {
      return statusOption.color;
    }
    

    
    return statusColors[status] || colors.primary;
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(option => 
      option.label === status || option.value === status
    );
    
    return statusOption ? statusOption.label : status;
  };

  const getComplaintTypeIcon = (type) => {
    const icons = {
      PRODUCT: "cube",
      DELIVERY: "truck",
      SERVICE: "headset",
      BILLING: "credit-card",
      OTHER: "question-circle"
    };
    return icons[type] || "exclamation-circle";
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  if (loading && !refreshing) {
    return (
      <ScreenComponent style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Typo size={18} style={{ fontWeight: '600' }}>My Complaints</Typo>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Typo style={styles.errorText}>{error}</Typo>
            <TouchableOpacity 
              onPress={fetchMyComplaints} 
              style={styles.retryButton}
              activeOpacity={0.7}
            >
              <Typo style={{ color: colors.primary }}>Retry</Typo>
            </TouchableOpacity>
          </View>
        )}

        {complaints.length === 0 && !error && !loading && (
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={60} color="#CCCCCC" />
            <Typo size={16} style={styles.emptyText}>No complaints yet</Typo>
            <Typo size={14} style={styles.emptySubText}>
              Your submitted complaints will appear here
            </Typo>
          </View>
        )}

        {complaints.map((complaint) => (
          <TouchableOpacity 
            key={complaint.idReclamation || Math.random().toString()} 
            style={[styles.complaintCard, 
              complaint.description && complaint.description.length > 100 ? styles.largeCard : 
              complaint.description && complaint.description.length > 50 ? styles.mediumCard : styles.standardCard
            ]}
            onPress={() => handleViewDetails(complaint)}
            activeOpacity={0.7}
          >
            <View style={styles.complaintHeader}>
              <View style={styles.typeContainer}>
                <View style={styles.iconCircle}>
                  <FontAwesome 
                    name={getComplaintTypeIcon(complaint.type)} 
                    size={14} 
                    color="#FFFFFF" 
                  />
                </View>
                <Typo size={16} style={styles.titleText}>
                  {complaint.title || "Complaint"}
                </Typo>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                <Typo size={12} style={styles.statusText}>
                  {getStatusLabel(complaint.status) || "PENDING"}
                </Typo>
              </View>
            </View>
            
            <View style={styles.complaintDetails}>
              <View style={styles.detailRow}>
                <FontAwesome name="calendar" size={14} color="#777777" style={styles.detailIcon} />
                <Typo style={styles.detailText}>
                  {formatDate(complaint.dateReclamation)}
                </Typo>
              </View>

              {complaint.commandeId && (
                <View style={styles.detailRow}>
                  <FontAwesome name="shopping-cart" size={14} color="#777777" style={styles.detailIcon} />
                  <Typo style={styles.detailText}>
                    Order #{complaint.commandeId}
                  </Typo>
                </View>
              )}
              
              {complaint.description && (
                <View style={[styles.descriptionContainer, 
                  complaint.description.length > 100 ? styles.largeDescriptionContainer : 
                  complaint.description.length > 50 ? styles.mediumDescriptionContainer : {}
                ]}>
                  <Typo 
                    size={13} 
                    style={styles.descriptionText} 
                    numberOfLines={complaint.description.length > 100 ? 5 : complaint.description.length > 50 ? 3 : 2}
                  >
                    {complaint.description}
                  </Typo>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  standardCard: {
    minHeight: 150,
  },
  mediumCard: {
    minHeight: 180,
  },
  largeCard: {
    minHeight: 230,
  },
  complaintCard: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleText: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._4,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  complaintDetails: {
    marginVertical: spacingY._8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 16,
    marginRight: 8,
  },
  detailText: {
    color: '#555',
    fontSize: 14,
  },
  descriptionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: spacingX._10,
    marginTop: spacingY._5,
  },
  mediumDescriptionContainer: {
    maxHeight: 90,
  },
  largeDescriptionContainer: {
    maxHeight: 140,
  },
  descriptionText: {
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._40,
    paddingHorizontal: spacingX._20,
  },
  emptyText: {
    marginTop: spacingY._15,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#999',
    marginTop: spacingY._5,
    textAlign: 'center',
  },
  errorContainer: {
    padding: spacingY._15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: radius._12,
    marginHorizontal: spacingX._10,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  }
});

export default ComplaintsScreen;