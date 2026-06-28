// Enhanced ReviewsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Animated
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import ReviewsList from '../components/ReviewsList';
import AddReviewForm from '../components/AddReviewFrom';
import Typo from '../components/Typo';
import colors from '../config/colors';
import { spacingY, spacingX, radius } from '../config/spacing';
import { useAuth } from '../auth/AuthContext';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Update this to match your actual backend URL

const ReviewsScreen = ({ productId, navigation, route }) => {
  const { user, token } = useAuth();
  const [showAddReview, setShowAddReview] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const queryClient = useQueryClient();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Animation on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Configure headers for all requests
  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`
  }), [token]);

  // Fetch product reviews
  const { 
    data: reviews, 
    isLoading: isLoadingReviews, 
    error: reviewsError,
    refetch: refetchReviews
  } = useQuery(
    ['productReviews', productId],
    async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/Products/${productId}/reviews`,
          token ? { headers: getHeaders() } : undefined
        );
        return Array.isArray(response.data) && response.data.length === 0 
          ? [] 
          : response.data;
      } catch (error) {
        console.error('Error fetching product reviews:', error);
        if (error.response && error.response.status === 401) {
          return [];
        }
        throw error;
      }
    },
    {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        if (error.response && error.response.status === 401) return false;
        return failureCount < 2;
      }
    }
  );

  // Fetch user's existing review for this product if logged in
  const { 
    data: userReview,
    isLoading: isLoadingUserReview,
    refetch: refetchUserReview
  } = useQuery(
    ['userReview', productId, user?.id],
    async () => {
      if (!token || !user?.id) return null;
      try {
        const response = await axios.get(
          `${API_URL}/api/rate/rating/${productId}`, 
          { headers: getHeaders() }
        );
        return response.data;
      } catch (error) {
        if (error.response && (error.response.status === 404 || 
            (error.response.status === 400 && error.response.data?.error?.includes("not found")))) {
          console.log('No existing review found for this user and product');
          return null;
        }
        if (error.response && error.response.status === 401) {
          console.log('Authentication error fetching user review');
          return null;
        }
        throw error;
      }
    },
    {
      enabled: !!token && !!user?.id,
      staleTime: 60 * 1000,
      retry: false
    }
  );
  
  // Refresh data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      refetchReviews();
      if (token && user?.id) {
        refetchUserReview();
      }
    }, [refetchReviews, refetchUserReview, token, user?.id])
  );

  // Add review mutation
  const addReviewMutation = useMutation(
    async (reviewData) => {
      const payload = {
        clientId: user.id,
        productId: parseInt(productId),
        rating: reviewData.rating,
        comment: reviewData.comment
      };

      const response = await axios.post(
        `${API_URL}/api/rate`, 
        payload,
        { headers: getHeaders() }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['productReviews', productId]);
        queryClient.invalidateQueries(['userReview', productId, user?.id]);
        queryClient.invalidateQueries(['productDetails', productId]);
        setShowAddReview(false);
        Alert.alert('Success', 'Your review has been submitted!');
      },
      onError: (error) => {
        console.error('Error adding review:', error);
        if (error.response && error.response.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.'
          );
        } else {
          Alert.alert(
            'Error',
            error.response?.data?.error || 'Failed to submit review. Please try again.'
          );
        }
      }
    }
  );

  // Update review mutation
  const updateReviewMutation = useMutation(
    async (reviewData) => {
      const payload = {
        rating: reviewData.rating,
        comment: reviewData.comment
      };

      const response = await axios.put(
        `${API_URL}/api/rate/ratings/${productId}`, 
        payload,
        { headers: getHeaders() }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['productReviews', productId]);
        queryClient.invalidateQueries(['userReview', productId, user?.id]);
        queryClient.invalidateQueries(['productDetails', productId]);
        setShowAddReview(false);
        setCurrentReview(null);
        Alert.alert('Success', 'Your review has been updated!');
      },
      onError: (error) => {
        console.error('Error updating review:', error);
        if (error.response && error.response.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.'
          );
        } else {
          Alert.alert(
            'Error',
            error.response?.data?.error || 'Failed to update review. Please try again.'
          );
        }
      }
    }
  );

  // Improved edit review handler - directly use the userReview data
  const handleEditReview = () => {
    if (!userReview) {
      refetchUserReview().then((data) => {
        if (data) {
          console.log('Setting current review from refetched data:', data);
          setCurrentReview(data);
          setShowAddReview(true);
        } else {
          Alert.alert('Error', 'Could not retrieve your current review. Please try again.');
        }
      }).catch(error => {
        console.error('Error fetching latest review data:', error);
        Alert.alert('Error', 'Could not retrieve your current review. Please try again.');
      });
    } else {
      console.log('Setting current review directly:', userReview);
      setCurrentReview(userReview);
      setShowAddReview(true);
    }
  };

  const handleAddReviewClick = () => {
    if (!token) {
      Alert.alert(
        "Login Required", 
        "Please log in to leave a review.",
        [{ text: "OK" }]
      );
      return;
    }
    setCurrentReview(null); // Make sure we clear any previous review
    setShowAddReview(true);
  };

  const handleSubmitReview = (reviewData) => {
    if (currentReview) {
      updateReviewMutation.mutate(reviewData);
    } else {
      addReviewMutation.mutate(reviewData);
    }
  };

  const handleCancelReview = () => {
    setShowAddReview(false);
    setCurrentReview(null);
  };

  // If showing review form, don't show reviews list to avoid nesting scrollable components
  if (showAddReview) {
    return (
      <SafeAreaView style={styles.fullContainer}>
        <AddReviewForm 
          productId={productId}
          onSubmit={handleSubmitReview}
          isSubmitting={addReviewMutation.isLoading || updateReviewMutation.isLoading}
          currentReview={currentReview}
          onCancel={handleCancelReview}
        />
      </SafeAreaView>
    );
  }

  // Otherwise, show "add review" button or "edit review" button, plus reviews list
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.reviewActionsContainer}>
          {userReview ? (
            <View style={styles.userReviewContainer}>
              <View style={styles.userReviewTextContainer}>
                <Feather name="check-circle" size={18} color={colors.green} style={styles.checkIcon} />
                <Typo style={styles.userReviewText}>
                  You've reviewed this product
                </Typo>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditReview}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={16} color={colors.white} style={styles.buttonIcon} />
                <Typo style={styles.editButtonText}>Edit</Typo>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={handleAddReviewClick}
              activeOpacity={0.7}
            >
              <AntDesign name="star" size={18} color={colors.white} style={styles.buttonIcon} />
              <Typo style={styles.addReviewText}>Write a Review</Typo>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.reviewsHeaderContainer}>
          <Typo style={styles.reviewsTitle}>Customer Reviews</Typo>
          {reviews && reviews.length > 0 && (
            <View style={styles.reviewCountContainer}>
              <Typo style={styles.reviewCount}>
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </Typo>
            </View>
          )}
        </View>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.reviewsListContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ReviewsList 
          reviews={reviews || []}
          isLoading={isLoadingReviews}
          error={reviewsError}
        />
      </Animated.View>
      
      {(isLoadingReviews || isLoadingUserReview) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewsListContainer: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
  },
  reviewActionsContainer: {
    marginBottom: spacingY._15,
  },
  addReviewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addReviewText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: spacingX._8,
  },
  userReviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 158, 96, 0.08)',
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._16,
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: 'rgba(0, 158, 96, 0.15)',
  },
  userReviewTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkIcon: {
    marginRight: spacingX._8,
  },
  userReviewText: {
    color: colors.darkGray,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._16,
    borderRadius: radius._8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  editButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 14,
  },
  reviewsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacingY._8,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewCountContainer: {
    backgroundColor: colors.lightGray,
    paddingVertical: spacingY._4,
    paddingHorizontal: spacingX._10,
    borderRadius: 12,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.darkGray,
  }
});

export default ReviewsScreen;