import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IntroScreen({ navigation }) {
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                // ⚠️ GEÇİCİ: Test için flag'i temizle – test bittikten sonra bu satırı SİL
                await AsyncStorage.removeItem('onboardingCompleted');

                const onboardingDone = await AsyncStorage.getItem('onboardingCompleted');
                if (onboardingDone === 'true') {
                    // Onboarding tamamlanmış, direkt Main'e git
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    // İlk açılış – onboarding göster
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }],
                    });
                }
            } catch (e) {
                console.warn('IntroScreen error:', e);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            }
        };

        checkOnboarding();
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
