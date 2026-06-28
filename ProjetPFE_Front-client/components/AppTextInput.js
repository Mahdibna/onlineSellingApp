import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';

const AppTextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  ...otherProps
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mediumGray}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...otherProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacingY._5,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: radius._8,
    padding: spacingX._12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  multilineInput: {
    paddingTop: spacingY._10,
    paddingBottom: spacingY._10,
    height: 'auto',
  },
});

export default AppTextInput;