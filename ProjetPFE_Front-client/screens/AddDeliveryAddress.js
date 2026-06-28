import React from 'react';
import { StyleSheet, View } from 'react-native';
import { normalizeY } from 'utils/normalize';

// Components
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import AddressForm from 'components/AddressForm'; // Adjust path if needed
import colors from 'config/colors';
import { spacingX, spacingY, radius } from 'config/spacing';

function AddDeliveryAddress({ navigation, route }) {
  // Extract both onSave callback and existing address data (if in edit mode)
  const { onSave, existingAddress } = route.params || {};

  // Handle save: pass formData directly since fields match
  const handleSave = (formData) => {
    if (onSave) {
      onSave(formData);
    }
    navigation.goBack();
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScreenComponent style={styles.container}>
      <Header
        label={existingAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
        onBack={() => navigation.goBack()}
      />
      <AddressForm
        initialData={existingAddress || {}}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditMode={!!existingAddress}
        customRender={{
          header: (
            <View style={styles.sectionTitleContainer}>
              <Typo size={16} style={styles.sectionTitle}>
                Address Details
              </Typo>
            </View>
          ),
          hideContainer: true, // Remove AddressForm's default container
        }}
        containerStyle={styles.formContainer}
      />
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBG,
  },
  formContainer: {
    padding: spacingX._20,
    paddingBottom: spacingY._40,
  },
  sectionTitleContainer: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._20,
    alignSelf: 'flex-start',
    marginBottom: spacingY._15,
    marginTop: spacingY._15,
    marginLeft: spacingX._20,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: '500',
  },
});

export default AddDeliveryAddress;