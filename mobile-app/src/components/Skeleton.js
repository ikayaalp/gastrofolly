import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function Skeleton({ width, height, borderRadius = 8, style }) {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                })
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [pulseAnim]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity: pulseAnim,
                },
                style
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#1f2937', // dark gray matching the theme
        overflow: 'hidden',
    }
});
