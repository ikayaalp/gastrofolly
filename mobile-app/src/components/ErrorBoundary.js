import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    handleRetry = () => this.setState({ hasError: false });

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Bir şeyler ters gitti</Text>
                    <Text style={styles.subtitle}>Lütfen tekrar deneyin.</Text>
                    <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
    subtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 24, textAlign: 'center' },
    button: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
