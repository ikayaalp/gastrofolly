import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Alert
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import forumService from '../api/forumService';

export default function EditTopicScreen({ route, navigation }) {
    const { topic } = route.params;
    const insets = useSafeAreaInsets();
    
    const [content, setContent] = useState(topic?.content || '');
    const categoryId = topic?.categoryId || (topic?.category?.id) || '';
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Hata', 'Lütfen içerik girin.');
            return;
        }

        let generatedTitle = content.trim().split('\n')[0].substring(0, 50);
        if (!generatedTitle) generatedTitle = "Medya Paylaşımı";
        if (content.trim().length > 50) generatedTitle += "...";

        setSaving(true);
        const result = await forumService.editTopic(topic.id, {
            title: generatedTitle,
            content,
            categoryId
        });

        setSaving(false);

        if (result.success) {
            Alert.alert('Başarılı', 'Gönderiniz güncellendi.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Hata', result.error || 'Gönderi güncellenemedi.');
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: '#0a0a0a' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gönderiyi Düzenle</Text>
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={saving}
                    style={[styles.saveButton, saving && { opacity: 0.5 }]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Check color="#fff" size={24} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
                        <TextInput
                            style={styles.contentInput}
                            value={content}
                            onChangeText={setContent}
                            placeholder="Düşüncelerinizi yazın..."
                            placeholderTextColor="#6b7280"
                            multiline
                            textAlignVertical="top"
                            autoFocus
                        />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        backgroundColor: '#0a0a0a',
    },
    backButton: {
        padding: 8,
    },
    saveButton: {
        padding: 8,
        backgroundColor: '#ea580c',
        borderRadius: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    contentInput: {
        color: '#e5e7eb',
        fontSize: 16,
        minHeight: 200,
        padding: 0,
    }
});
