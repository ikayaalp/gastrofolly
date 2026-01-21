import config from './config';

export const sendMessageToAI = async (messages) => {
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/ai-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        return data;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

export const transcribeAudio = async (uri) => {
    try {
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const type = 'audio/m4a'; // Ensure consistent type for iOS/Android

        formData.append('audio', {
            uri,
            name: filename,
            type
        });

        const response = await fetch(`${config.API_BASE_URL}/api/speech-to-text`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                // Content-Type: multipart/form-data header must be omitted 
                // so the browser can add the boundary parameter automatically
            },
            body: formData,
        });

        const responseText = await response.text();
        console.log('Transcribe API Response Raw:', responseText);

        if (!response.ok) {
            throw new Error(responseText || 'Ses tanıma hatası');
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Sunucu geçersiz yanıt döndürdü: ${responseText.substring(0, 50)}...`);
        }

        return data.text;
    } catch (error) {
        console.error('Transcribe Error:', error);
        throw error;
    }
};
