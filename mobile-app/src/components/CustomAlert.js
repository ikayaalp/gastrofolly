import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({
    visible,
    title,
    message,
    buttons = [{ text: 'Tamam', onPress: () => { } }],
    onClose,
    type = 'info' // 'info', 'success', 'warning', 'error', 'confirm'
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={48} color="#10b981" />;
            case 'warning':
                return <AlertTriangle size={48} color="#f59e0b" />;
            case 'error':
                return <XCircle size={48} color="#ef4444" />;
            case 'confirm':
                return <AlertTriangle size={48} color="#ea580c" />;
            default:
                return <Info size={48} color="#ea580c" />;
        }
    };

    const handleButtonPress = (button) => {
        if (button.onPress) {
            button.onPress();
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    {message && <Text style={styles.message}>{message}</Text>}

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'cancel' && styles.cancelButton,
                                    button.style === 'destructive' && styles.destructiveButton,
                                    buttons.length === 1 && styles.singleButton,
                                ]}
                                onPress={() => handleButtonPress(button)}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.style === 'cancel' && styles.cancelButtonText,
                                        button.style === 'destructive' && styles.destructiveButtonText,
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width - 40,
        maxWidth: 340,
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    singleButton: {
        flex: 1,
    },
    cancelButton: {
        backgroundColor: '#1f2937',
    },
    destructiveButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cancelButtonText: {
        color: '#9ca3af',
    },
    destructiveButtonText: {
        color: '#fff',
    },
});

export default CustomAlert;
