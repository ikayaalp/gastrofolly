import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_GAP } from '../constants/layout';

export default function FloatingTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    if (focusedOptions.tabBarStyle?.display === 'none') {
        return null;
    }

    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom - 12, 24) : Math.max(insets.bottom - 12, 0);

    const activeColor = '#ea580c';
    const inactiveColor = '#ffffff';
    // iOS: cam efekti (kullanıcı onayladı, dokunulmuyor). Android: expo-blur'da aynı
    // ayarlar çok daha şeffaf/farklı render olduğu için eski mat görünümüne geri alındı.
    const blurIntensity = Platform.OS === 'android' ? 80 : 20;

    return (
        <View style={[styles.container, { bottom: bottomPadding + TAB_BAR_BOTTOM_GAP }]}>
            <BlurView intensity={blurIntensity} tint="dark" style={styles.blurContainer}>
                {/* Overlay layers */}
                <View style={styles.overlay} />
                <View style={[styles.highlight, Platform.OS === 'android' && styles.highlightAndroid]} />

                <View style={styles.tabBar}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                ? options.title
                                : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        const color = isFocused ? activeColor : inactiveColor;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabItem}
                            >
                                {options.tabBarIcon && options.tabBarIcon({ color, size: 24 })}
                                <Text style={[styles.label, { color }]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        borderRadius: 35,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    blurContainer: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 35,
        overflow: 'hidden',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    highlight: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    highlightAndroid: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tabBar: {
        flexDirection: 'row',
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 4,
    }
});
