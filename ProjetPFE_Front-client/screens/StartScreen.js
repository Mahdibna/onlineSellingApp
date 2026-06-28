import { Text, StyleSheet, View, SafeAreaView, Image, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from 'config/colors';
import { useState } from 'react';
import StartSelector from 'components/StartSelector';
import { radius, spacingY } from 'config/spacing';
import Typo from 'components/Typo';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
const { width, height } = Dimensions.get('screen');
let paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

function StartScreen(props) {
  const [selected, setSelected] = useState('Register');
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.c1, { opacity: 0.5 }]} />
        <View
          style={[
            styles.orangeCircle,
            { bottom: '40%', left: '5%', opacity: 0.5, width: width / 1.1 },
          ]}
        />
        <View style={[styles.orangeCircle, { opacity: 0.4 }]} />
        <View style={styles.c2} />
      </View>
      <BlurView intensity={100} tint="light" style={styles.blurContainer}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.imgContainer}>
          <Image source={require('../assets/startimage29.jpeg')} style={styles.img} />
        </Animated.View>
        <View>
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify().damping(12)}>
            <Typo size={26} style={styles.text}>
              Discover Your
            </Typo>
            <Typo size={26} style={styles.text}>
              Best Products Here
            </Typo>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(500).springify().damping(12)}>
            <Typo style={[styles.body, { marginTop: '5%' }]}>
              Explore all the most exiting best products
            </Typo>
            <Typo style={styles.body}>based on your interest and needs here</Typo>
          </Animated.View>
        </View>
        <StartSelector selected={selected} setSelected={setSelected} />
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFill,
    paddingTop: paddingTop,
    padding: spacingY._10,
    paddingBottom: '10%',
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: radius._20,
    justifyContent: 'space-between',
  },
  background: {
    flex: 1,
    paddingBottom: '10%',
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFill,
  },
  imgContainer: {
    width: '100%',
    height: height * 0.47,
    shadowColor: colors.white,
    shadowOpacity: 1,
    shadowOffset: { height: 0, width: 0 },
  },
  img: {
    width: '100%',
    height: '100%',
    borderRadius: radius._20,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  body: {
    color: colors.gray,
    textAlign: 'center',
    alignSelf: 'center',
    margin: 2,
  },
  c1: {
    width: width,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: colors.lightBlue,
    alignSelf: 'flex-end',
  },
  c2: {
    width: width / 1.2,
    height: width / 1.2,
    borderRadius: width / 2,
    backgroundColor: '#fee2e2',
    opacity: 0.8,
    marginBottom: 50,
    alignSelf: 'flex-end',
  },
  orangeCircle: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: '#fed7aa',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});

export default StartScreen;
