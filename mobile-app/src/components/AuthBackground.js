import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Using gradient background instead of image to avoid build issues


export default function AuthBackground() {
    return (
        <View style={styles.container}>
            {/* Base Dark Background */}
            <View style={styles.baseBackground} />

            {/* Gradient Overlay with warm tones */}
            <LinearGradient
                colors={['#1a1a1a', '#2d1810', '#1a1a1a', '#0a0a0a']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.gradient}
            />

            {/* Subtle overlay for depth */}
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
    baseBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a0a',
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
        backgroundColor: 'rgba(255, 107, 0, 0.05)',
    },
});
