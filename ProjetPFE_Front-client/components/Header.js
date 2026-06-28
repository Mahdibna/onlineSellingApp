import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { normalizeY } from '../utils/normalize';
import Typo from './Typo';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';

function Header({ label }) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[
          styles.iconBg,
          { backgroundColor: label == 'Notifications' ? colors.lighterGray : colors.white },
        ]}
        onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
      </TouchableOpacity>
      <Typo style={styles.headerText} size={22}>
        {label}
      </Typo>
      <View style={{ width: normalizeY(38) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacingX._20,
    marginBottom: spacingY._5,
  },
  headerText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  iconBg: {
    backgroundColor: colors.white,
    padding: spacingY._10,
    borderRadius: radius._20,
  },
});
export default Header;
