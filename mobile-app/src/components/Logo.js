import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

const LOGO_SOURCE = require('../../assets/logo-full.png');
const ASPECT_RATIO = 1881 / 634;

export default function Logo({ size = 'md', style }) {
    const sizeMap = {
        sm: 24,
        md: 38, // Default header size
        lg: 48,
        xl: 80  // For auth screens
    };

    const height = sizeMap[size] || sizeMap['md'];
    const width = height * ASPECT_RATIO;

    return (
        <View style={[styles.container, style]}>
            <Image
                source={LOGO_SOURCE}
                style={{ width, height, resizeMode: 'contain' }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});

