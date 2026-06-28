import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from '../components/Typo';
import { normalizeY } from '../utils/normalize';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  primaryAction, 
  secondaryAction,
  onBackdropPress
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onBackdropPress}
    >
      <TouchableWithoutFeedback onPress={onBackdropPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <BlurView intensity={30} tint="dark" style={styles.modalContainer}>
              <View style={styles.alertCard}>
                {title && (
                  <Typo size={20} style={styles.title}>
                    {title}
                  </Typo>
                )}
                
                {message && (
                  <Typo size={16} style={styles.message}>
                    {message}
                  </Typo>
                )}
                
                <View style={styles.buttonContainer}>
                  {secondaryAction && (
                    <TouchableOpacity 
                      style={[styles.button, styles.secondaryButton]} 
                      onPress={secondaryAction.onPress}
                    >
                      <Typo style={styles.secondaryButtonText}>
                        {secondaryAction.text}
                      </Typo>
                    </TouchableOpacity>
                  )}
                  
                  {primaryAction && (
                    <TouchableOpacity 
                      style={[
                        styles.button, 
                        styles.primaryButton,
                        secondaryAction ? { marginLeft: spacingX._10 } : { flex: 1 }
                      ]} 
                      onPress={primaryAction.onPress}
                    >
                      <Typo style={styles.primaryButtonText}>
                        {primaryAction.text}
                      </Typo>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </BlurView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: radius._20,
    overflow: 'hidden',
  },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: radius._20,
    padding: spacingY._20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacingY._10,
    color: colors.black,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacingY._20,
    lineHeight: 22,
    color: colors.gray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: spacingY._12,
    borderRadius: radius._12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: normalizeY(16),
  },
  secondaryButtonText: {
    color: colors.gray,
    fontWeight: '500',
    fontSize: normalizeY(16),
  },
});

export default CustomAlert;