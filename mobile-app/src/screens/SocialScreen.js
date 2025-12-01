import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChefHat } from 'lucide-react-native';

export default function SocialScreen() {
    return (
        <View style={styles.container}>
            <ChefHat size={64} color="#ea580c" />
            <Text style={styles.title}>Chef Sosyal</Text>
            <Text style={styles.subtitle}>Çok Yakında!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: 16,
        marginTop: 8,
    },
});
