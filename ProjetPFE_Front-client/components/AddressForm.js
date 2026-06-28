 import React, { useReducer, useEffect, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Animated, Easing, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { normalizeY } from 'utils/normalize';

// Components
import AppButton from 'components/AppButton';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';

// Config
import colors from 'config/colors';
import { spacingX, spacingY, radius } from 'config/spacing';

// Reducer for form state
const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
};

// Memoized FormInput component
const FormInput = memo(
  ({ value, onChangeText, iconName, label, error, inputRef, ...props }) => {
    useEffect(() => {
      console.log(`FormInput for ${label} rendered`);
    });

    return (
      <View style={styles.inputContainer}>
        <Typo style={styles.inputLabel}>
          {label}
          <Typo style={{ color: colors.red }}>*</Typo>
        </Typo>
        <View style={[styles.inputView, error ? styles.inputError : null]}>
          <View style={styles.iconContainer}>
            <Feather name={iconName} size={18} color="#777" />
          </View>
          <View style={styles.divider} />
          <TextInput
            ref={inputRef}
            style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="rgba(117, 117, 117, 0.7)"
            accessibilityLabel={props.accessibilityLabel}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={props.keyboardType || 'default'}
            blurOnSubmit={props.multiline ? false : true}
            returnKeyType={props.multiline ? 'default' : 'next'}
            {...(Platform.OS === 'android' && { textAlignVertical: 'center' })}
            {...props}
          />
        </View>
        {error ? <Typo style={styles.errorText}>{error}</Typo> : null}
      </View>
    );
  },
  (prevProps, nextProps) => {
    const propsEqual =
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.onChangeText === nextProps.onChangeText &&
      prevProps.iconName === nextProps.iconName &&
      prevProps.label === nextProps.label &&
      prevProps.accessibilityLabel === nextProps.accessibilityLabel &&
      prevProps.keyboardType === nextProps.keyboardType &&
      prevProps.multiline === nextProps.multiline;
    if (!propsEqual) {
      console.log(`FormInput for ${nextProps.label} re-rendering due to prop changes`);
    }
    return propsEqual;
  }
);

const AddressForm = memo(
  ({
    initialData = {},
    onSave,
    onCancel,
    isEditMode = false,
    customRender = {},
    containerStyle = {},
  }) => {
    const [state, dispatch] = useReducer(formReducer, {
      formData: {
        rue: initialData.rue || '',
        numero: initialData.numero || '',
        ville: initialData.ville || '',
        pays: initialData.pays || '',
        indication: initialData.indication || '',
      },
      errors: {
        rue: '',
        numero: '',
        ville: '',
        pays: '',
        indication: '',
      },
    });

    const { formData, errors } = state;

    // Refs for input focus management
    const rueInputRef = useRef(null);
    const numeroInputRef = useRef(null);
    const indicationInputRef = useRef(null);
    const villeInputRef = useRef(null);
    const paysInputRef = useRef(null);
    const activeInputRef = useRef(null);

    // Animation for the section title
    const titleOpacityAnim = useRef(new Animated.Value(0)).current;
    const titleTranslateYAnim = useRef(new Animated.Value(10)).current;

    useEffect(() => {
      console.log('AddressForm rendered');
      Animated.parallel([
        Animated.timing(titleOpacityAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateYAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Focus first input on mount
      rueInputRef.current?.focus();
    }, []);

    useEffect(() => {
      // Restore focus if re-render occurs
      if (activeInputRef.current) {
        const refMap = {
          rue: rueInputRef,
          numero: numeroInputRef,
          indication: indicationInputRef,
          ville: villeInputRef,
          pays: paysInputRef,
        };
        const inputRef = refMap[activeInputRef.current];
        inputRef.current?.focus();
      }
    });

    const handleInputChange = useCallback((field, value) => {
      dispatch({ type: 'UPDATE_FIELD', field, value });
      activeInputRef.current = field;
    }, []);

    const validateForm = () => {
      const newErrors = {};
      if (!formData.rue.trim()) newErrors.rue = 'Street name is required';
      if (!formData.numero.trim()) newErrors.numero = 'Building/house number is required';
      if (!formData.ville.trim()) newErrors.ville = 'City is required';
      if (!formData.pays.trim()) newErrors.pays = 'Country is required';
      dispatch({ type: 'SET_ERRORS', errors: newErrors });
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
      if (validateForm()) {
        onSave(formData);
      }
    };

    const FormContent = () => (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, containerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!customRender.hideHeader && (
          <Animated.View
            style={[
              styles.sectionTitleContainer,
              {
                opacity: titleOpacityAnim,
                transform: [{ translateY: titleTranslateYAnim }],
              },
            ]}
          >
            <View style={styles.titleWrapper}>
              <Feather name="map-pin" size={20} color={colors.primary} style={styles.titleIcon} />
              <Typo size={normalizeY(22)} style={styles.sectionTitle}>
                Address Details
              </Typo>
            </View>
            <View style={styles.titleUnderline} />
          </Animated.View>
        )}

        <FormInput
          key="rue"
          value={formData.rue}
          onChangeText={(text) => handleInputChange('rue', text)}
          iconName="map-pin"
          label="Street name"
          error={errors.rue}
          accessibilityLabel="Street name"
          inputRef={rueInputRef}
          onSubmitEditing={() => numeroInputRef.current?.focus()}
        />

        <FormInput
          key="numero"
          value={formData.numero}
          onChangeText={(text) => handleInputChange('numero', text)}
          iconName="home"
          label="Building/House number"
          error={errors.numero}
          accessibilityLabel="Building or house number"
          keyboardType="numeric"
          inputRef={numeroInputRef}
          onSubmitEditing={() => indicationInputRef.current?.focus()}
        />

        <FormInput
          key="indication"
          value={formData.indication}
          onChangeText={(text) => handleInputChange('indication', text)}
          iconName="info"
          label="Additional information"
          error={errors.indication}
          accessibilityLabel="Additional information"
          multiline
          numberOfLines={3}
          inputRef={indicationInputRef}
          onSubmitEditing={() => villeInputRef.current?.focus()}
        />

        <View style={styles.rowContainer}>
          <View style={[styles.inputContainer, styles.halfContainer]}>
            <FormInput
              key="ville"
              value={formData.ville}
              onChangeText={(text) => handleInputChange('ville', text)}
              iconName="map"
              label="City"
              error={errors.ville}
              accessibilityLabel="City"
              inputRef={villeInputRef}
              onSubmitEditing={() => paysInputRef.current?.focus()}
            />
          </View>
          <View style={[styles.inputContainer, styles.halfContainer]}>
            <FormInput
              key="pays"
              value={formData.pays}
              onChangeText={(text) => handleInputChange('pays', text)}
              iconName="globe"
              label="Country"
              error={errors.pays}
              accessibilityLabel="Country"
              inputRef={paysInputRef}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {customRender.saveButton ? (
            customRender.saveButton(handleSave)
          ) : (
            <AppButton
              label={isEditMode ? 'Update Address' : 'Save Address'}
              onPress={handleSave}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius._12,
              }}
            />
          )}
          {onCancel && (
            <AppButton
              label="Cancel"
              onPress={onCancel}
              style={{
                backgroundColor: colors.greyLight,
                borderRadius: radius._12,
                marginTop: spacingY._10,
              }}
              textStyle={{ color: colors.dark }}
            />
          )}
        </View>
      </ScrollView>
    );

    if (customRender.hideContainer) {
      return <FormContent />;
    }

    return (
      <ScreenComponent style={styles.container}>
        {customRender.header}
        <FormContent />
      </ScreenComponent>
    );
  },
  (prevProps, nextProps) => {
    const propsEqual =
      prevProps.initialData === nextProps.initialData &&
      prevProps.onSave === nextProps.onSave &&
      prevProps.onCancel === nextProps.onCancel &&
      prevProps.isEditMode === nextProps.isEditMode &&
      prevProps.customRender === nextProps.customRender &&
      prevProps.containerStyle === nextProps.containerStyle;
    if (!propsEqual) {
      console.log('AddressForm re-rendering due to prop changes');
    }
    return propsEqual;
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBG,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacingX._25,
    paddingBottom: spacingY._40,
  },
  sectionTitleContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacingY._35,
    paddingVertical: spacingY._10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleIcon: {
    marginRight: spacingX._12,
  },
  sectionTitle: {
    color: colors.dark,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'left',
  },
  titleUnderline: {
    height: 3,
    width: '50%',
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    marginTop: spacingY._5,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    marginTop: spacingY._20,
    borderRadius: radius._15,
  },
  inputLabel: {
    fontSize: normalizeY(16),
    fontWeight: '500',
    color: '#333',
    marginBottom: spacingY._10,
    letterSpacing: 0.5,
  },
  inputView: {
    backgroundColor: '#FDFCFB',
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginTop: spacingY._5,
  },
  inputError: {
    borderColor: colors.red,
    borderRadius: radius._15,
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: '80%',
    width: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacingX._12,
    fontSize: normalizeY(15),
    fontWeight: '500',
    color: '#222',
    fontFamily: 'Roboto',
    height: '100%',
  },
  errorText: {
    color: colors.red,
    fontSize: normalizeY(11),
    marginTop: spacingY._5,
    opacity: 0.9,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfContainer: {
    width: '48%',
  },
  buttonContainer: {
    marginTop: spacingY._20,
  },
});

export default AddressForm;