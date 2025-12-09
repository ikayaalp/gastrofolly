import React from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Yemek/Kurs görselleri - Unsplash'tan
const FOOD_IMAGES = [
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1482049016gy6a1-b1d1e33f26a6?q=80&w=400&auto=format&fit=crop',
];

// Grid hesaplamaları
const COLUMNS = 3;
const TILE_SIZE = width / COLUMNS;
const ROWS = Math.ceil((height * 1.2) / TILE_SIZE);
const TOTAL_TILES = COLUMNS * ROWS;

export default function AuthBackground() {
    // Tile grid oluştur
    const tiles = Array.from({ length: TOTAL_TILES }, (_, i) =>
        FOOD_IMAGES[i % FOOD_IMAGES.length]
    );

    return (
        <View style={styles.container}>
            {/* Image Grid */}
            <View style={styles.grid}>
                {tiles.map((src, index) => (
                    <View key={index} style={styles.tileContainer}>
                        <Image
                            source={{ uri: src }}
                            style={styles.tile}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </View>

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
            />

            {/* Blur Effect Overlay */}
            <View style={styles.blurOverlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: width,
        height: height * 1.2,
        backgroundColor: '#000',
    },
    tileContainer: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        padding: 2,
    },
    tile: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        opacity: 0.6,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
});
