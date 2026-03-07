import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions
} from 'react-native';
import { LogIn, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function LoginRequiredModal({ visible, onLogin, onCancel, message }) {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 50,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            opacityAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible]);
    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                {/* Background Blur */}
                <BlurView
                    intensity={60}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />

                {/* Semi-transparent dark overlay on top of blur for better contrast */}
                <TouchableOpacity
                    style={styles.backdropPressable}
                    activeOpacity={1}
                    onPress={onCancel}
                />

                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                        <X size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* Icon */}
                    <LinearGradient
                        colors={['#ea580c', '#f97316']}
                        style={styles.iconContainer}
                    >
                        <LogIn size={32} color="#fff" />
                    </LinearGradient>

                    {/* Text */}
                    <Text style={styles.title}>Giriş Yapmalısınız</Text>
                    <Text style={styles.message}>
                        {message || 'Bu özelliği kullanmak için hesabınıza giriş yapmanız gerekmektedir.'}
                    </Text>

                    {/* Buttons */}
                    <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
                        <LinearGradient
                            colors={['#ea580c', '#c2410c']}
                            style={styles.loginButtonGradient}
                        >
                            <LogIn size={18} color="#fff" />
                            <Text style={styles.loginButtonText}>Giriş Yap</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>Vazgeç</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdropPressable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Additional darkening on top of blur
    },
    container: {
        width: '100%',
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#27272a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    loginButton: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
    },
    loginButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#71717a',
        fontSize: 15,
        fontWeight: '500',
    },
});
