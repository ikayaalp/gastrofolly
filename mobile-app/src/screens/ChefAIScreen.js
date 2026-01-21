import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Keyboard,
    Dimensions,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Modal,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, ChefHat, History, X, Clock, Trash2, AlertTriangle } from 'lucide-react-native';
import { sendMessageToAI } from '../api/aiService';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';

const SUGGESTIONS = [
    { id: 1, text: "🍝 İtalyan Makarnası Tarifi", icon: "🍝" },
    { id: 2, text: "🥩 Et Nasıl Mühürlenir?", icon: "🥩" },
    { id: 3, text: "🍰 Kolay Tatlı Önerisi", icon: "🍰" },
    { id: 4, text: "🥗 Sağlıklı Akşam Yemeği", icon: "🥗" },
];

const MAX_HISTORY_ITEMS = 10;

export default function ChefAIScreen() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const flatListRef = useRef(null);

    // Initial load of history
    useEffect(() => {
        loadHistory();

        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    // Auto-archive on blur (tab switch)
    const messagesRef = useRef(messages);

    // Keep ref in sync
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Auto-archive on blur (tab switch)
    useFocusEffect(
        useCallback(() => {
            // Screen focused
            return () => {
                // Screen blur - save and clear
                // Use ref to access latest messages without triggering re-run on every message change
                if (messagesRef.current.length > 0) {
                    saveCurrentChatToHistory(messagesRef.current);
                }
            };
        }, []) // Empty dependency array = only runs on focus/blur
    );

    const loadHistory = async () => {
        try {
            const savedHistory = await AsyncStorage.getItem('chef_ai_history');
            if (savedHistory) {
                setChatHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const saveCurrentChatToHistory = async (currentMessages) => {
        const msgs = currentMessages || messages; // Use arg or state
        if (!msgs || msgs.length === 0) return;

        const newHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            preview: msgs[msgs.length - 1]?.content.substring(0, 50) + '...',
            messages: msgs
        };

        try {
            const currentHistory = await AsyncStorage.getItem('chef_ai_history');
            let history = currentHistory ? JSON.parse(currentHistory) : [];

            // Add new item to start
            history.unshift(newHistoryItem);

            // Keep only max items
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }

            await AsyncStorage.setItem('chef_ai_history', JSON.stringify(history));
            setChatHistory(history);
            setMessages([]); // Clear current chat
        } catch (error) {
            console.error('Error saving history:', error);
        }
    };

    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem('chef_ai_history');
            setChatHistory([]);
            setShowClearConfirm(false); // Close confirmation
            setIsMenuVisible(false); // Close the history menu too
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const loadHistoryItem = (item) => {
        setMessages(item.messages);
        setIsMenuVisible(false);
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    const sendMessage = async (text) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { role: 'user', content: text.trim() };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const data = await sendMessageToAI(newMessages);
            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            let errorMessage = 'Bağlantı hatası. Lütfen tekrar deneyin.';

            if (error.message?.includes('Çok fazla istek') || error.message?.includes('429')) {
                errorMessage = 'Üzgünüm, şu anda çok yoğunum. Lütfen biraz bekleyip tekrar deneyin. 👨‍🍳';
            }

            setMessages([...newMessages, {
                role: 'assistant',
                content: errorMessage
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => sendMessage(input);
    const handleSuggestionPress = (text) => sendMessage(text);

    const renderItem = ({ item }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.botMessageContainer
            ]}>
                {!isUser && (
                    <View style={styles.botAvatarContainer}>
                        <LinearGradient
                            colors={['#f97316', '#ea580c']}
                            style={styles.botAvatar}
                        >
                            <ChefHat size={18} color="#fff" />
                        </LinearGradient>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    styles.shadow,
                    !isUser && { width: '85%', maxWidth: '85%' } // Bot messages slightly wider for markdown
                ]}>
                    {isUser ? (
                        <Text style={[styles.messageText, styles.userText]}>{item.content}</Text>
                    ) : (
                        <Markdown
                            style={{
                                body: { color: '#e4e4e7', fontSize: 15, lineHeight: 24 },
                                heading1: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
                                heading2: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
                                heading3: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginVertical: 6 },
                                strong: { color: '#fff', fontWeight: 'bold' },
                                em: { fontStyle: 'italic', color: '#d4d4d8' },
                                bullet_list: { marginVertical: 8 },
                                ordered_list: { marginVertical: 8 },
                                bullet_list_icon: { color: '#ea580c', fontSize: 20, marginRight: 8 }, // Orange bullets
                                bullet_list_content: { fontSize: 15, lineHeight: 24, color: '#e4e4e7' },
                                ordered_list_content: { fontSize: 15, lineHeight: 24, color: '#e4e4e7' },
                                paragraph: { marginBottom: 12 },
                                link: { color: '#ea580c' },
                                list_item: { marginBottom: 6 },
                            }}
                        >
                            {item.content}
                        </Markdown>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#18181b', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTitleContainer}>
                            <LinearGradient
                                colors={['#ea580c', '#f97316']}
                                style={styles.headerIconBg}
                            >
                                <ChefHat size={24} color="#fff" />
                            </LinearGradient>
                            <View>
                                <Text style={styles.headerTitle}>Chef AI</Text>
                                <Text style={styles.headerSubtitle}>Kişisel Mutfak Asistanın</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => setIsMenuVisible(true)}
                        >
                            <History size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={styles.content}>
                        {messages.length === 0 ? (
                            <ScrollView
                                contentContainerStyle={styles.emptyStateScroll}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={true}
                            >
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateTitle}>Merhaba Şef! 👋</Text>
                                        <Text style={styles.emptyStateSubtitle}>
                                            Bugün mutfakta sana nasıl yardımcı olabilirim?
                                        </Text>
                                        <View style={styles.suggestionsContainer}>
                                            <Text style={styles.suggestionsTitle}>Örnek Sorular</Text>
                                            <View style={styles.suggestionsGrid}>
                                                {SUGGESTIONS.map((suggestion) => (
                                                    <TouchableOpacity
                                                        key={suggestion.id}
                                                        style={styles.suggestionChip}
                                                        onPress={() => handleSuggestionPress(suggestion.text)}
                                                    >
                                                        <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                                                        <Text style={styles.suggestionText}>{suggestion.text}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </ScrollView>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={styles.listContent}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                ListFooterComponent={
                                    isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <View style={styles.loadingBubble}>
                                                <ActivityIndicator size="small" color="#ea580c" />
                                                <Text style={styles.loadingText}>Chef düşünüyor...</Text>
                                            </View>
                                        </View>
                                    ) : null
                                }
                            />
                        )}
                    </View>

                    <View style={[
                        styles.inputWrapper,
                        { paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 20 : 8) : (Platform.OS === 'ios' ? 110 : 120) }
                    ]}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={input}
                                onChangeText={setInput}
                                placeholder="Bir şeyler sor (örn: Lazanya tarifi)..."
                                placeholderTextColor="#71717a"
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!input.trim() || isLoading) && styles.sendButtonDisabled
                                ]}
                                onPress={handleSend}
                                disabled={!input.trim() || isLoading}
                            >
                                <LinearGradient
                                    colors={['#ea580c', '#f97316']}
                                    style={styles.sendButtonGradient}
                                >
                                    <Send size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* History Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isMenuVisible}
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sohbet Geçmişi</Text>
                            <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {chatHistory.length > 0 ? (
                            <>
                                <FlatList
                                    data={chatHistory}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.historyItem}
                                            onPress={() => loadHistoryItem(item)}
                                        >
                                            <View style={styles.historyIcon}>
                                                <Clock size={20} color="#a1a1aa" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                                                <Text style={styles.historyPreview} numberOfLines={1}>
                                                    {item.preview}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    contentContainerStyle={styles.historyList}
                                />
                                <TouchableOpacity
                                    style={styles.clearHistoryButton}
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        setTimeout(() => setShowClearConfirm(true), 300);
                                    }}
                                >
                                    <Trash2 size={18} color="#ef4444" style={{ marginRight: 8 }} />
                                    <Text style={styles.clearHistoryText}>Geçmişi Temizle</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.emptyHistory}>
                                <Clock size={48} color="#3f3f46" />
                                <Text style={styles.emptyHistoryText}>Henüz kaydedilmiş sohbet yok.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Custom Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showClearConfirm}
                onRequestClose={() => setShowClearConfirm(false)}
            >
                <View style={styles.alertContainer}>
                    <View style={styles.alertContent}>
                        <View style={styles.alertIconContainer}>
                            <AlertTriangle size={32} color="#ef4444" />
                        </View>
                        <Text style={styles.alertTitle}>Geçmişi Temizle</Text>
                        <Text style={styles.alertMessage}>
                            Tüm sohbet geçmişi silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
                        </Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={[styles.alertButton, styles.alertButtonCancel]}
                                onPress={() => setShowClearConfirm(false)}
                            >
                                <Text style={styles.alertButtonCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertButton, styles.alertButtonConfirm]}
                                onPress={clearHistory}
                            >
                                <Text style={styles.alertButtonConfirmText}>Evet, Sil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#a1a1aa',
        marginTop: 2,
    },
    menuButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#27272a',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    emptyStateScroll: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        paddingTop: 60,
        paddingBottom: 40,
    },
    emptyStateIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#27272a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    emptyStateTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    suggestionsContainer: {
        width: '100%',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#71717a',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    suggestionIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    suggestionText: {
        color: '#e4e4e7',
        fontSize: 14,
        fontWeight: '500',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    botAvatarContainer: {
        marginRight: 10,
        marginBottom: 4,
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 24,
    },
    userBubble: {
        backgroundColor: '#ea580c',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#27272a',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 24,
    },
    userText: {
        color: '#fff',
    },
    botText: {
        color: '#e4e4e7',
    },
    inputWrapper: {
        backgroundColor: '#09090b',
        padding: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#18181b',
        borderRadius: 28,
        padding: 4, // Reduced from 6
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15, // Reduced font size slightly
        maxHeight: 100, // Reduced max height
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    sendButton: {
        width: 44, // Reduced size
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27272a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    loadingText: {
        color: '#a1a1aa',
        fontSize: 14,
        marginLeft: 10,
        fontStyle: 'italic',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#18181b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    historyList: {
        padding: 20,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#27272a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    historyIcon: {
        marginRight: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#18181b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyDate: {
        fontSize: 12,
        color: '#a1a1aa',
        marginBottom: 4,
    },
    historyPreview: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    emptyHistory: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyHistoryText: {
        marginTop: 16,
        color: '#71717a',
        fontSize: 16,
    },
    clearHistoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#27272a',
        marginBottom: 20 // Adjust for safe area if needed
    },
    clearHistoryText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    // Custom Alert Styles
    alertContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContent: {
        width: '100%',
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    alertIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 15,
        color: '#a1a1aa',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertButtonCancel: {
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    alertButtonConfirm: {
        backgroundColor: '#ef4444',
    },
    alertButtonCancelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    alertButtonConfirmText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    }
});
