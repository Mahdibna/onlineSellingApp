import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  TextInput,
  Alert
} from 'react-native';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import Typo from './Typo';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import { MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../auth/AuthContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const RatingStar = ({ filled, size = 24, touchable = false, onPress = null, index = 0 }) => {
  return (
    <TouchableOpacity 
      activeOpacity={touchable ? 0.7 : 1}
      onPress={() => touchable && onPress && onPress(index)}
      style={{ padding: 3 }}
    >
      <AntDesign
        name={filled ? "star" : "staro"}
        size={size}
        color={filled ? '#FFC300' : colors.gray}
      />
    </TouchableOpacity>
  );
};

const ReviewCard = ({ review, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const comment = review.commentaire || review.comment || '';
  const shouldShowExpandButton = !compact && comment.length > 100;
  
  const formatDate = () => {
    if (!review.date) return "Recently";
    
    try {
      const date = new Date(review.date);
      if (isNaN(date.getTime())) return "Recently";
      
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) return "Today";
      if (diffDays < 2) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return "Recently";
    }
  };
  
  const getInitials = () => {
    const name = review.clientName || "User";
    const words = name.split(' ');
    
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    
    return name[0].toUpperCase();
  };
  
  const getAvatarColor = () => {
    const name = review.clientName || "User";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE',
      '#B8E986', '#8B572A', '#7ED321', '#417505', '#BD10E0',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const rating = typeof review.rating === 'string' 
    ? parseInt(review.rating, 10) 
    : review.rating || 0;
  
  return (
    <View style={[styles.reviewCard, compact && styles.compactReviewCard]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthor}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
            <Typo style={styles.avatarText}>{getInitials()}</Typo>
          </View>
          <View style={styles.authorInfo}>
            <Typo size={14} style={styles.authorName}>
              {review.clientName || "Anonymous User"}
            </Typo>
            <Typo size={12} style={styles.reviewDate}>
              {formatDate()}
            </Typo>
          </View>
        </View>
        
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <RatingStar 
              key={`review-star-${index}`}
              filled={rating >= index + 1}
              size={compact ? 14 : 16}
            />
          ))}
        </View>
      </View>
      
      {comment.length > 0 && (
        <View style={styles.reviewContent}>
          <Typo style={styles.reviewText} numberOfLines={expanded || compact ? undefined : 3}>
            {comment}
          </Typo>
          
          {shouldShowExpandButton && (
            <TouchableOpacity 
              style={styles.expandButton} 
              onPress={() => setExpanded(!expanded)}
            >
              <Typo style={styles.expandButtonText}>
                {expanded ? "Show less" : "Read more"}
              </Typo>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const AddReviewModal = ({ visible, onClose, onSubmit, isSubmitting, currentReview = null }) => {
  const [rating, setRating] = useState(currentReview?.rating || 0);
  const [comment, setComment] = useState(currentReview?.comment || currentReview?.commentaire || '');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      setRating(currentReview?.rating || 0);
      setComment(currentReview?.comment || currentReview?.commentaire || '');
      setError('');
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, currentReview, slideAnim, fadeAnim]);
  
  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setError('');
    onSubmit({
      rating,
      comment
    });
  };
  
  const modalContent = (
    <Animated.View 
      style={[
        styles.modalContent,
        { 
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.modalHeader}>
        <Typo size={18} style={styles.modalTitle}>
          {currentReview ? 'Edit Your Review' : 'Write a Review'}
        </Typo>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <AntDesign name="close" size={24} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
      
      {error ? <Typo style={styles.errorText}>{error}</Typo> : null}
      
      <View style={styles.ratingInputContainer}>
        <Typo style={styles.ratingLabel}>Tap to rate:</Typo>
        <View style={styles.centeredStarsRow}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <RatingStar 
              key={`rating-star-${index}`}
              filled={rating >= index + 1}
              touchable
              onPress={() => setRating(index + 1)}
              index={index + 1}
              size={32}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.commentInputContainer}>
        <View style={styles.commentLabelContainer}>
          <MaterialCommunityIcons 
            name="comment-text-outline" 
            size={18} 
            color={colors.primary} 
            style={styles.commentIcon}
          />
          <Typo style={styles.commentLabel}>Tell us about your experience</Typo>
        </View>
        
        <View style={[
          styles.textInputContainer,
          isFocused && styles.textInputContainerFocused
        ]}>
          <TextInput
            style={styles.commentInput}
            placeholder="What did you like or dislike about this product?"
            placeholderTextColor={colors.gray}
            multiline
            value={comment}
            onChangeText={setComment}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            textAlignVertical="top"
          />
        </View>
        <Typo size={12} style={styles.commentHint}>
          Your review helps other shoppers make better decisions
        </Typo>
      </View>
      
      <View style={styles.modalFooter}>
        <TouchableOpacity 
          style={[styles.cancelButton, isSubmitting && styles.disabledButton]} 
          onPress={onClose}
          disabled={isSubmitting}
        >
          <Typo style={styles.cancelButtonText}>Cancel</Typo>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Typo style={styles.submitButtonText}>
              {currentReview ? 'Update' : 'Submit'}
            </Typo>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={e => e.stopPropagation()}
        >
          {modalContent}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const ReviewsList = ({ reviews = [], compact = false, onViewAllReviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.emptyReviewsContainer}>
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={40}
          color={colors.gray}
        />
        <Typo style={styles.emptyReviewsText}>No reviews yet</Typo>
        <Typo style={styles.emptyReviewsSubtext}>
          Be the first to share your experience!
        </Typo>
      </View>
    );
  }
  
  const reviewsToShow = compact ? reviews.slice(0, 2) : reviews;
  
  return (
    <View style={styles.reviewsListContainer}>
      {reviewsToShow.map((review, index) => (
        <ReviewCard 
          key={`review-${review.id || index}`} 
          review={review} 
          compact={compact}
        />
      ))}
      
      {compact && reviews.length > 2 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onViewAllReviews}
        >
          <Typo style={styles.viewAllButtonText}>
            View all {reviews.length} reviews
          </Typo>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const RatingSummary = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) return null;
  
  return (
    <View style={styles.reviewCountBanner}>
      <Typo style={styles.reviewCountText}>
        {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
      </Typo>
    </View>
  );
};

const EnhancedReviewsSection = ({ 
  productId, 
  reviews = [], 
  isLoading = false, 
  onViewAllReviews,
  onRefresh,
  compact = true,
  navigation
}) => {
  const { user, token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const queryClient = useQueryClient();
  
  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`
  }), [token]);
  
  const userReview = React.useMemo(() => {
    if (!user || !reviews) return null;
    return reviews.find(review => 
      review.clientId === user.id || 
      review.client?.id === user.id
    );
  }, [reviews, user]);
  
  const handleReviewError = (error) => {
    console.error('Review error:', error);
    
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = error.response.data.error;
      
      if (errorMessage.includes("need to buy this item")) {
        Alert.alert(
          "Purchase Required",
          "You need to purchase this product before you can review it.",
          [{ text: "OK" }]
        );
      } else if (errorMessage.includes("already rated")) {
        Alert.alert(
          "Review Already Exists",
          "You have already reviewed this product. You can edit your existing review instead.",
          [{ text: "OK" }]
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Could not submit review',
          text2: errorMessage,
          position: 'bottom',
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Could not submit review',
        text2: 'Please try again later',
        position: 'bottom',
      });
    }
  };
  
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
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Review submitted',
          text2: 'Thank you for your feedback!',
          position: 'bottom',
        });
        if (onRefresh) {
          onRefresh();
        }
      },
      onError: (error) => {
        handleReviewError(error);
      }
    }
  );

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
        setModalVisible(false);
        setCurrentReview(null);
        Toast.show({
          type: 'success',
          text1: 'Review updated',
          text2: 'Your review has been updated successfully!',
          position: 'bottom',
        });
        if (onRefresh) {
          onRefresh();
        }
      },
      onError: (error) => {
        console.error('Error updating review:', error);
        Toast.show({
          type: 'error',
          text1: 'Could not update review',
          text2: error.response?.data?.error || 'Please try again later',
          position: 'bottom',
        });
      }
    }
  );
  
  const handleAddReview = () => {
    if (!token) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to leave a review.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sign In",
            onPress: () => navigation && navigation.navigate('Signin')
          }
        ]
      );
      return;
    }
    
    setCurrentReview(null);
    setModalVisible(true);
  };
  
  const handleEditReview = () => {
    setCurrentReview(userReview);
    setModalVisible(true);
  };
  
  const handleSubmitReview = (reviewData) => {
    if (currentReview) {
      updateReviewMutation.mutate(reviewData);
    } else {
      addReviewMutation.mutate(reviewData);
    }
  };
  
  const renderReviewButton = () => {
    if (userReview) {
      return (
        <TouchableOpacity
          style={styles.editReviewButton}
          onPress={handleEditReview}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
          <Typo style={styles.editReviewButtonText}>Edit Your Review</Typo>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.addReviewButton}
        onPress={handleAddReview}
      >
        <AntDesign name="star" size={18} color={colors.white} />
        <Typo style={styles.addReviewButtonText}>Write a Review</Typo>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, compact && { marginTop: 0 }]}>
      <View style={styles.headerRow}>
        <Typo size={18} style={styles.sectionTitle}>
          {compact ? "Reviews" : "Customer Reviews"}
        </Typo>
        {renderReviewButton()}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {!compact && reviews.length > 0 && <RatingSummary reviews={reviews} />}
          <ReviewsList 
            reviews={reviews} 
            compact={compact} 
            onViewAllReviews={onViewAllReviews}
          />
        </>
      )}
      
      <AddReviewModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setCurrentReview(null);
        }}
        onSubmit={handleSubmitReview}
        isSubmitting={addReviewMutation.isLoading || updateReviewMutation.isLoading}
        currentReview={currentReview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacingY._15,
    marginBottom: spacingY._10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius._20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addReviewButtonText: {
    color: colors.white,
    fontWeight: '500',
    marginLeft: 6,
  },
  editReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius._20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editReviewButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    padding: spacingY._30,
    backgroundColor: colors.white,
    borderRadius: radius._16,
    marginTop: spacingY._10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: spacingY._10,
    color: colors.darkGray,
  },
  emptyReviewsSubtext: {
    color: colors.gray,
    textAlign: 'center',
  },
  reviewCountBanner: {
    backgroundColor: colors.white,
    borderRadius: radius._16,
    padding: spacingY._12,
    marginBottom: spacingY._16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
  },
  reviewCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centeredStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewsListContainer: {
    marginTop: spacingY._10,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius._16,
    padding: spacingY._16,
    marginBottom: spacingY._12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  compactReviewCard: {
    padding: spacingY._12,
    marginBottom: spacingY._10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingY._10,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._10,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  authorInfo: {
    justifyContent: 'center',
  },
  authorName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    color: colors.gray,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewContent: {
    marginTop: spacingY._8,
  },
  reviewText: {
    color: colors.darkGray,
    lineHeight: 20,
  },
  expandButton: {
    marginTop: spacingY._8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 13,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._12,
    marginTop: spacingY._8,
    backgroundColor: colors.white,
    borderRadius: radius._16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewAllButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginRight: spacingX._6,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: colors.white,
    borderRadius: radius._20,
    padding: spacingY._20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  modalTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  errorText: {
    color: colors.red,
    marginBottom: spacingY._15,
    textAlign: 'center',
  },
  ratingInputContainer: {
    marginBottom: spacingY._20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  
  commentInputContainer: {
    marginBottom: spacingY._20,
  },
  commentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  commentIcon: {
    marginRight: 8,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkGray,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: radius._12,
    backgroundColor: colors.inputField,
    minHeight: 120,
    maxHeight: 200,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  textInputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  commentScrollView: {
    maxHeight: 200,
  },
  commentInput: {
    padding: spacingY._12,
    color: colors.black,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    lineHeight: 22,
  },
  commentHint: {
    color: colors.gray,
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacingY._10,
    marginRight: spacingX._10,
    borderRadius: radius._10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontWeight: '500',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacingY._10,
    borderRadius: radius._10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default EnhancedReviewsSection;