import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Image } from 'react-native';
import colors from '../config/colors';
import { sliderImages } from '../utils/data';
import { normalizeX } from '../utils/normalize';
import { radius, spacingX, spacingY } from 'config/spacing';

const { width: screenWidth, height } = Dimensions.get('window');
const adjustedWidth = screenWidth - normalizeX(40);

function ImageSlideShow(props) {
  const images = sliderImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      scrollToNextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const scrollToNextImage = () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= images.length) {
      nextIndex = 0;
    }
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: nextIndex * adjustedWidth,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(ev) => {
          const index = Math.floor(ev.nativeEvent.contentOffset.x / adjustedWidth);
          setCurrentIndex(index);
        }}>
        {images.map((image, index) => (
          <Image key={index} source={image} style={styles.image} />
        ))}
      </ScrollView>
      <View style={styles.indicatorContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                width: index === currentIndex ? 16 : 8,
                backgroundColor: index === currentIndex ? colors.accent : '#E5E7EB',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.25,
    width: adjustedWidth,
    borderRadius: radius._20,
    overflow: 'hidden',
    marginVertical: spacingY._15,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  image: {
    resizeMode: 'cover',
    height: '100%',
    width: adjustedWidth,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: spacingY._12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: spacingX._3,
  },
});

export default ImageSlideShow;
