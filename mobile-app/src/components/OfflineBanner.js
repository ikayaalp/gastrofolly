import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
    const netInfo = useNetInfo();
    const insets = useSafeAreaInsets();
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (netInfo.isConnected === false) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [netInfo.isConnected, opacity]);

    return (
        <Animated.View 
            pointerEvents={netInfo.isConnected === false ? "auto" : "none"}
            style={[styles.banner, { paddingTop: insets.top, opacity }]}
        >
            <View style={styles.content}>
                <Text style={styles.text}>İnternet bağlantısı yok</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ea580c',
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
