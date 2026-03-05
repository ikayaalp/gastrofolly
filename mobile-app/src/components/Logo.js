import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const LOGO_SOURCE = require('../../assets/icon.png');

export default function Logo({ size = 'md', style, textStyle }) {
    const sizeMap = {
        sm: { img: 24, text: 20, margin: -2 },
        md: { img: 32, text: 26, margin: -3 }, // Default header size
        lg: { img: 48, text: 38, margin: -4 },
        xl: { img: 80, text: 60, margin: -8 } // For auth screens
    };

    const currentSize = sizeMap[size] || sizeMap['md'];
    const { img: imgSize, text: textSize, margin: marginLeft } = currentSize;

    return (
        <View style={[styles.container, style]}>
            <Image
                source={LOGO_SOURCE}
                style={{ width: imgSize, height: imgSize, borderRadius: imgSize / 2, resizeMode: 'contain' }}
            />
            <Text style={[styles.text, { fontSize: textSize, marginLeft: marginLeft }, textStyle]}>
                <Text style={styles.orangeText}>ulin</Text>
                <Text style={styles.whiteText}>ora</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    orangeText: {
        color: '#f97316',
    },
    whiteText: {
        color: '#fff',
    }
});
