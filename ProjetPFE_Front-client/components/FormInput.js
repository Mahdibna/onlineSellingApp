// components/FormInput.js
import React from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  Text
} from 'react-native';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from './Typo';

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  error,
  ...otherProps
}) {
  return (
    <View style={styles.container}>
      {label && <Typo style={styles.label}>{label}</Typo>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          style,
          error && styles.errorInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...otherProps}
      />
      {error && <Typo style={styles.errorText}>{error}</Typo>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingY._15,
  },
  label: {
    marginBottom: spacingY._5,
    fontSize: 14,
    color: colors.darkGray,
  },
  input: {
    backgroundColor: colors.lighterGray,
    borderRadius: radius._8,
    padding: spacingX._12,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  multiline: {
    paddingTop: spacingY._10,
    paddingBottom: spacingY._10,
  },
  errorInput: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacingY._5,
  }
});

export default FormInput;