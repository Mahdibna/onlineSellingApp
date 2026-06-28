import React, { useState, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import colors from 'config/colors';
import { View, Image, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Typo from './Typo';
import { normalizeX, normalizeY } from 'utils/normalize';
import { spacingY } from 'config/spacing';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('screen');

function FavouriteCard({ item, onRemove, userAuthority }) {
  const navigation = useNavigation();
  const imgSize = width * 0.2;
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Memoize promotion value calculation
  const promotionValue = useMemo(() => {
    if (!item.promotion && !item.promotionParticulier && !item.promotionPartenaire) {
      return 0;
    }

    if (userAuthority === 'userpartner' && item.promotionPartenaire) {
      return item.promotionPartenaire;
    }

    return item.promotionParticulier || item.promotion || 0;
  }, [item, userAuthority]);

  // Memoize image source to prevent unnecessary recreations
  const imageSource = useMemo(() => {
    try {
      setImageError(false);

      // Handle array of images
      if (Array.isArray(item.imageUrl)) {
        const validImage = item.imageUrl.find(img => img && typeof img === 'string');
        if (validImage) return { uri: validImage };
      }

      // Handle single string image URL
      if (typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
        return { uri: item.imageUrl };
      }

      return require('assets/produit.png');
    } catch (error) {
      setImageError(true);
      return require('assets/produit.png');
    }
  }, [item.imageUrl]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('ItemDetails', item)}
      activeOpacity={0.7}
    >
      <View style={styles.imgContainer}>
        {isImageLoading && !imageError && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}
        <Image
          source={imageSource}
          resizeMode="contain"
          style={{
            width: imgSize,
            height: imgSize,
            opacity: isImageLoading ? 0 : 1
          }}
          onLoadStart={() => setIsImageLoading(true)}
          onLoad={() => setIsImageLoading(false)}
          onError={() => {
            setImageError(true);
            setIsImageLoading(false);
          }}
          defaultSource={require('assets/produit.png')}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={styles.row}>
          <Typo size={17} style={{ fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
            {item.name}
          </Typo>
          <TouchableOpacity onPress={() => onRemove(item.id)}>
            <MaterialIcons name="delete-outline" size={normalizeY(24)} color={colors.red} />
          </TouchableOpacity>
        </View>
        {item.category && <Typo style={styles.catText}>{item.category}</Typo>}

        <View style={styles.priceContainer}>
          <Typo style={{ fontWeight: 'bold' }}>
            {typeof item.price === 'number' ? item.price.toFixed(2) : item.price} TND
          </Typo>

          {promotionValue > 0 && (
            <View style={styles.promotionBadge}>
              <Typo size={12} style={styles.promotionText}>
                {promotionValue * 100}%
              </Typo>
            </View>
          )}
        </View>

        {!item.disponibilite && (
          <Typo size={12} style={styles.unavailableText}>
            Currently unavailable
          </Typo>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: normalizeY(15),
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    padding: normalizeY(15),
    borderRadius: normalizeY(12),
    gap: normalizeX(10),
  },
  imgContainer: {
    padding: spacingY._10,
    backgroundColor: colors.lighterGray,
    borderRadius: normalizeY(15),
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.25,
    height: width * 0.25,
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catText: {
    color: colors.lightGray,
    fontWeight: 'bold',
    marginBottom: normalizeY(3),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeX(10),
  },
  promotionBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: normalizeX(8),
    paddingVertical: normalizeY(2),
    borderRadius: normalizeY(10),
  },
  promotionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  unavailableText: {
    color: '#FF3B30',
    marginTop: normalizeY(5),
  }
});

export default React.memo(FavouriteCard);
