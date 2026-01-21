import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface GroqError extends Error {
    status?: number;
    message: string;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;

        console.log('STT API received request:', {
            hasFile: !!file,
            fileName: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
        });

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API Key missing' }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        // Groq requires file specific handling, using OpenAI SDK's transcription helper
        // which handles FormData/File conversion naturally for the most part.
        // However, Next.js 'File' object needs to be compatible.

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3', // Groq's Whisper model
            response_format: 'json',
            language: 'tr', // Hint for Turkish
            temperature: 0.0,
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error: unknown) {
        console.error('Speech-to-Text Error:', error);
        const groqError = error as GroqError;

        if (groqError?.status === 413) {
            return NextResponse.json({ error: 'Audio file too large.' }, { status: 413 });
        }

        return NextResponse.json(
            { error: 'Transcription failed.', details: groqError?.message || String(error) },
            { status: 500 }
        );
    }
}
