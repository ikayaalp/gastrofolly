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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, BookOpen, Award, Rocket, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        icon: ChefHat,
        title: 'Culinora Dünyasına\nHoş Geldiniz',
        subtitle: 'Gastronomi yolculuğunuzda size rehberlik ediyoruz',
        description: 'Profesyonel şeflerden öğrenin, mutfak becerilerinizi geliştirin',
        gradient: ['#ea580c', '#c2410c'],
    },
    {
        id: '2',
        icon: BookOpen,
        title: 'Her Şeyin\nKursu Burada',
        subtitle: 'Başlangıçtan uzmanlığa kadar tüm seviyeler',
        description: 'Yüzlerce video ders, pratik tarifler ve profesyonel ipuçları',
        gradient: ['#9333ea', '#7e22ce'],
    },
    {
        id: '3',
        icon: Award,
        title: 'Size Özel\nAbonelik Paketleri',
        subtitle: 'İhtiyacınıza uygun planı seçin',
        description: 'Premium üyelik ile tüm kurslara ve şeflere sınırsız erişim',
        gradient: ['#0891b2', '#0e7490'],
    },
    {
        id: '4',
        icon: Rocket,
        title: 'Hadi\nBaşlayalım!',
        subtitle: 'Mutfağın kapıları size açık',
        description: 'Hemen kayıt olun ve gastronomi dünyasını keşfedin',
        gradient: ['#16a34a', '#15803d'],
    },
];

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.replace('Register');
    };

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.replace('Register');
    };

    const renderSlide = ({ item, index }) => {
        const Icon = item.icon;

        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={['#000', '#0a0a0a']}
                    style={styles.slideGradient}
                >
                    {/* Icon Container */}
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={item.gradient}
                            style={styles.iconContainer}
                        >
                            <Icon size={Platform.OS === 'android' ? 36 : 48} color="white" />
                        </LinearGradient>
                    </View>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 30, 10],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
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
                                    backgroundColor: '#ea580c',
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Skip Button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Atla</Text>
                </TouchableOpacity>
            )}

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
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={32}
            />

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {renderDots()}

                {isLastSlide ? (
                    <TouchableOpacity
                        style={styles.getStartedButton}
                        onPress={handleGetStarted}
                    >
                        <LinearGradient
                            colors={['#ea580c', '#c2410c']}
                            style={styles.getStartedGradient}
                        >
                            <Text style={styles.getStartedText}>Başlayalım</Text>
                            <Rocket size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                    >
                        <View style={styles.nextButtonInner}>
                            <Text style={styles.nextText}>İleri</Text>
                            <ChevronRight size={20} color="#ea580c" />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
    slide: {
        width,
        height: Platform.OS === 'android' ? height * 0.65 : height * 0.75,
    },
    slideGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconWrapper: {
        marginBottom: Platform.OS === 'android' ? 20 : 32,
    },
    iconContainer: {
        width: Platform.OS === 'android' ? 80 : 100,
        height: Platform.OS === 'android' ? 80 : 100,
        borderRadius: Platform.OS === 'android' ? 40 : 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
    },
    contentContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 16,
        color: '#ea580c',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    bottomSection: {
        position: 'absolute',
        bottom: Platform.OS === 'android' ? 60 : 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'android' ? 10 : 50,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Platform.OS === 'android' ? 16 : 32,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 4,
    },
    nextButton: {
        width: '100%',
    },
    nextButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.3)',
        gap: 8,
    },
    nextText: {
        color: '#ea580c',
        fontSize: 18,
        fontWeight: 'bold',
    },
    getStartedButton: {
        width: '100%',
    },
    getStartedGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
    },
    getStartedText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
