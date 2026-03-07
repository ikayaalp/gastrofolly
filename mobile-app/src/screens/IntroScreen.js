import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IntroScreen({ navigation }) {
    useEffect(() => {
        // Always go to Main (Home tab) - no onboarding, no login required
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
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
