import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    StatusBar,
    Platform,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ────────────────────────────────────────────────────────────────
// 3 Sayfa – Tabii tarzı tam ekran görsel + altta büyük yazı
// ────────────────────────────────────────────────────────────────
const slides = [
    {
        id: '1',
        image: require('../../assets/onboarding1.jpg'),
        title: 'Profesyonel\nGastronomi Kursları',
        subtitle: 'Şeflerden öğren, mutfakta ustalaş.',
        description:
            'Yüzlerce video ders, uygulamalı tarifler ve sertifikalı eğitimlerle gastronomi kariyerine başla.',
        accentColor: '#ea580c',
    },
    {
        id: '2',
        image: require('../../assets/onboarding2.png'),
        title: 'Chef Sosyal\nTopluluğu',
        subtitle: 'Paylaş, ilham al, bağlan.',
        description:
            'Binlerce yemek tutkunundan oluşan topluluğa katıl. Tariflerini paylaş, şeflerle etkileşime geç.',
        accentColor: '#ea580c',
    },
    {
        id: '3',
        image: require('../../assets/onboarding3.png'),
        title: 'Culi\nYapay Zeka Asistanın',
        subtitle: 'Kişisel mutfak danışmanın.',
        description:
            'AI destekli asistanın Culi ile tarifleri keşfet, sorularını sor ve sana özel öneriler al.',
        accentColor: '#ea580c',
    },
];

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // İlk açılışta onboarding tamamlandı mı kontrol et
    React.useEffect(() => {
        const check = async () => {
            const done = await AsyncStorage.getItem('onboardingCompleted');
            if (done === 'true') {
                navigation.replace('Main');
            } else {
                setIsReady(true);
            }
        };
        check();
    }, []);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleRegister = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.replace('Register');
    };

    const handleLogin = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.replace('Login');
    };

    // ────────────────────────────────────────────────────────────
    // Render each slide – full-screen image background + text at bottom
    // ────────────────────────────────────────────────────────────
    const renderSlide = ({ item }) => {
        const customImageStyle = { resizeMode: 'cover', top: 0 };
        const isFirstSlide = item.id === '1';

        return (
            <View style={styles.slide}>
                <ImageBackground
                    source={item.image}
                    style={styles.imageBackground}
                    imageStyle={customImageStyle}
                >
                    {isFirstSlide && (
                        <LinearGradient
                            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                            locations={[0, 0.25, 0.6]}
                            style={[styles.topGradientOverlay, StyleSheet.absoluteFill]}
                            pointerEvents="none"
                        >
                            <View style={styles.topTextContainer}>
                                <Text style={styles.title}>{item.title}</Text>
                            </View>
                        </LinearGradient>
                    )}

                    <LinearGradient
                        colors={
                            isFirstSlide
                                ? ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', '#000']
                                : ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)', '#000']
                        }
                        locations={
                            isFirstSlide
                                ? [0, 0.45, 0.7, 0.85, 1]
                                : [0, 0.35, 0.55, 0.72, 0.88]
                        }
                        style={[styles.gradientOverlay, StyleSheet.absoluteFill]}
                        pointerEvents="none"
                    >
                        <View style={styles.textContainer}>
                            {!isFirstSlide && <Text style={styles.title}>{item.title}</Text>}
                            <Text style={[styles.subtitle, { color: isFirstSlide ? '#fff' : item.accentColor }]}>
                                {item.subtitle}
                            </Text>
                            {!isFirstSlide && (
                                <Text style={styles.description}>
                                    {item.description}
                                </Text>
                            )}
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </View>
        );
    };

    // ────────────────────────────────────────────────────────────
    // Pagination dots
    // ────────────────────────────────────────────────────────────
    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {slides.map((slide, index) => {
                const inputRange = [
                    (index - 1) * width,
                    index * width,
                    (index + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 28, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.35, 1, 0.35],
                    extrapolate: 'clamp',
                });

                const bgColor = scrollX.interpolate({
                    inputRange,
                    outputRange: ['#555', slide.accentColor, '#555'],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: bgColor,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    const currentAccent = slides[currentIndex]?.accentColor || '#ea580c';

    // Onboarding kontrolü yapılırken bekle
    if (!isReady) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
            />

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {renderDots()}

                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={handleRegister}
                    activeOpacity={0.85}
                >
                    <View style={[styles.ctaGradient, { backgroundColor: currentAccent }]}>
                        <Text style={styles.ctaText}>Şimdi Üye Ol</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.loginPromptContainer}>
                    <Text style={styles.loginPromptText}>Bir hesabın var mı? </Text>
                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.7} hitSlop={{top: 15, bottom: 15, left: 10, right: 10}}>
                        <Text style={styles.loginPromptAction}>Giriş Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    slide: {
        width,
        height,
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    topGradientOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    topTextContainer: {
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'android' ? 60 : 70,
    },
    textContainer: {
        paddingHorizontal: 28,
        paddingBottom: Platform.OS === 'android' ? 200 : 220,
    },
    title: {
        fontSize: Platform.OS === 'android' ? 32 : 38,
        fontWeight: '900',
        color: '#fff',
        lineHeight: Platform.OS === 'android' ? 40 : 48,
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    description: {
        fontSize: 15,
        color: '#b0b0b0',
        lineHeight: 23,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'android' ? 36 : 50,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    ctaButton: {
        width: '100%',
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        width: '100%',
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginPromptContainer: {
        flexDirection: 'row',
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginPromptText: {
        color: '#d1d1d1',
        fontSize: 15,
        fontWeight: '500',
    },
    loginPromptAction: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
