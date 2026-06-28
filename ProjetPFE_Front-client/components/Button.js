import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import colors from '../config/colors';

/**
 * Custom Button component with loading state and styling options
 */
const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  textColor,
  backgroundColor,
  outline = false,
  icon,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        backgroundColor ? { backgroundColor } : null,
        outline ? styles.outline : null,
        disabled || loading ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={textColor || (outline ? colors.primary : colors.white)} 
          size="small" 
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              textColor ? { color: textColor } : null,
              outline ? styles.outlineText : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.7,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
});

export default Button;