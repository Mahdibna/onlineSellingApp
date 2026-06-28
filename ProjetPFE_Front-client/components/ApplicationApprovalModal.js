import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from '../components/Typo';

const ApplicationApprovalModal = ({ visible, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Typo size={18} style={styles.title}>Partnership Approved</Typo>
          </View>
          
          <View style={styles.content}>
            <Typo style={styles.message}>
              Your partnership application has been approved! Please sign in again to access your new account features.
            </Typo>
          </View>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={onConfirm}
          >
            <Typo size={16} style={styles.buttonText}>Logout</Typo>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    width: '100%',
    padding: spacingY._20,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    width: '100%',
    marginBottom: spacingY._20,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._30,
    borderRadius: radius._8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default ApplicationApprovalModal;