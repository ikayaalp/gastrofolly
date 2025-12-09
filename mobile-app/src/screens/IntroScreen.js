import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableWithoutFeedback, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IntroScreen({ navigation }) {
    const [isNavigating, setIsNavigating] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const scaleAnim = useState(new Animated.Value(0.8))[0];

    useEffect(() => {
        // Fade in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-navigate after 2 seconds
        const timer = setTimeout(() => {
            handleNavigate();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleNavigate = async () => {
        if (isNavigating) return;
        setIsNavigating(true);

        // Fade out animation
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setTimeout(async () => {
            try {
                // Check if onboarding is completed
                const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');

                if (!onboardingCompleted) {
                    // First time user - show onboarding
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }],
                    });
                    return;
                }

                // Check if user is logged in
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            } catch (error) {
                console.error('Auth check error:', error);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        }, 300);
    };

    return (
        <TouchableWithoutFeedback onPress={handleNavigate}>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <Text style={styles.chefText}>CHEF</Text>
                    <Text style={styles.versionText}>2.0</Text>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chefText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    versionText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#ea580c',
        marginLeft: 12,
        letterSpacing: 1,
    },
});
