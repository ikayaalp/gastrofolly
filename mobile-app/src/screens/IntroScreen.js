import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IntroScreen({ navigation }) {
    useEffect(() => {
        const checkAuthAndRoute = async () => {
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
        };

        checkAuthAndRoute();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#ea580c" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
