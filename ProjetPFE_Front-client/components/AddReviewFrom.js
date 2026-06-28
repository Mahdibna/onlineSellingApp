// Fixed AddReviewForm.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Typo from 'components/Typo';
import AppButton from './AppButton';
import AppTextInput from './AppTextInput';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';

const AddReviewForm = ({ 
  productId, 
  onSubmit, 
  isSubmitting, 
  currentReview = null,
  onCancel
}) => {
  // Initialize state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const isEditing = !!currentReview;
  
  // Improved useEffect to properly handle currentReview changes
  useEffect(() => {
    if (currentReview) {
      console.log('Setting form from currentReview:', currentReview);
      
      // Handle rating properly, ensure it's a number
      if (typeof currentReview.rating === 'number') {
        setRating(currentReview.rating);
      } else if (currentReview.rating) {
        const parsedRating = parseInt(currentReview.rating, 10);
        setRating(isNaN(parsedRating) ? 0 : parsedRating);
      }
      
      // Handle potential different field names for comments with more robust checks
      if (typeof currentReview.commentaire === 'string') {
        setComment(currentReview.commentaire);
      } else if (typeof currentReview.comment === 'string') {
        setComment(currentReview.comment);
      }
    }
  }, [currentReview]);

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

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

  return (
    <View style={styles.container}>
      <Typo style={styles.title}>
        {isEditing ? 'Edit Your Review' : 'Add a Review'}
      </Typo>
      
      {error ? <Typo style={styles.errorText}>{error}</Typo> : null}
      
      <View style={styles.ratingContainer}>
        <Typo style={styles.ratingLabel}>Your Rating:</Typo>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity 
              key={star}
              onPress={() => handleStarPress(star)}
              style={styles.starButton}
            >
              <AntDesign
                name={rating >= star ? "star" : "staro"}
                size={30}
                color={colors.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.commentContainer}>
        <Typo style={styles.commentLabel}>Your Comment (Optional):</Typo>
        <AppTextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience with this product..."
          multiline
          numberOfLines={4}
          style={styles.commentInput}
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        {isEditing && (
          <AppButton
            label="Cancel"
            onPress={onCancel}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          />
        )}
        
        <AppButton
          label={isEditing ? "Update Review" : "Submit Review"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        >
          {isSubmitting && (
            <ActivityIndicator 
              size="small" 
              color={colors.white} 
              style={styles.loadingIndicator}
            />
          )}
        </AppButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    padding: spacingY._15,
    marginVertical: spacingY._10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacingY._15,
    textAlign: 'center',
  },
  errorText: {
    color: colors.red,
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: spacingY._15,
  },
  ratingLabel: {
    fontWeight: '500',
    marginBottom: spacingY._8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: spacingX._5,
  },
  commentContainer: {
    marginBottom: spacingY._20,
  },
  commentLabel: {
    fontWeight: '500',
    marginBottom: spacingY._8,
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    marginRight: spacingX._10,
    backgroundColor: colors.lightGray,
  },
  cancelButtonText: {
    color: colors.black,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingIndicator: {
    marginLeft: spacingX._10,
  }
});

export default AddReviewForm;