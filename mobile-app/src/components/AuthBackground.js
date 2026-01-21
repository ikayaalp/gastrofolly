import React from 'react';
import { StyleSheet, View, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthBackground() {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/auth-background.jpg')}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                {/* Dark Gradient Overlay for readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', '#000000']}
                    locations={[0, 0.6, 1]}
                    style={styles.gradient}
                />
            </ImageBackground>
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
        backgroundColor: '#000',
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
