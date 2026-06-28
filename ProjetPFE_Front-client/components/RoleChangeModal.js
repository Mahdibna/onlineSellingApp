// RoleChangeModal.js - A custom modal component for better design
import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Typo from './Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';

const RoleChangeModal = ({ visible, newRole, onConfirm }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
    >
      <View style={styles.centeredView}>
        <LinearGradient
          colors={['#4A00E0', '#8E2DE2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalView}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={50} color="#4A00E0" />
            </View>
          </View>

          {/* Header */}
          <Typo style={styles.modalHeader}>Congratulations! 🎉</Typo>
          
          {/* Message */}
          <Typo style={styles.modalText}>
            Your status has been upgraded to
          </Typo>
          <Typo style={styles.roleText}>{newRole}</Typo>
          
          <Typo style={styles.subText}>
            You need to log in again to access your new benefits and exclusive features.
          </Typo>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="star" size={20} color="#FFF" />
              <Typo style={styles.benefitText}>Special discounts</Typo>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="gift" size={20} color="#FFF" />
              <Typo style={styles.benefitText}>Exclusive offers</Typo>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Typo style={styles.benefitText}>Priority support</Typo>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={onConfirm}
          >
            <LinearGradient
              colors={['#FFF', '#F0F0F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Typo style={styles.buttonText}>Log In Again</Typo>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: spacingX._20,
    borderRadius: radius._20,
    padding: spacingY._30,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  iconContainer: {
    marginBottom: spacingY._20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacingY._15,
  },
  modalText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: spacingY._5,
  },
  roleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacingY._15,
  },
  subText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: spacingY._20,
    opacity: 0.9,
  },
  benefitsList: {
    marginBottom: spacingY._30,
    gap: spacingY._10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  benefitText: {
    color: '#FFF',
    fontSize: 14,
  },
  button: {
    borderRadius: radius._10,
    overflow: 'hidden',
    width: '100%',
    marginTop: spacingY._20,
  },
  buttonGradient: {
    padding: spacingY._15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#4A00E0',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RoleChangeModal;