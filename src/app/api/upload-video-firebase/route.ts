import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { initializeApp, getApps } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const storage = getStorage(app)

export async function POST(request: NextRequest) {
  console.log('=== FIREBASE VIDEO UPLOAD API START ===')
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get("video") as File
    const lessonId = formData.get("lessonId") as string
    
    console.log('Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      lessonId: lessonId
    })
    
    if (!file) {
      return NextResponse.json({ error: "Video dosyası bulunamadı" }, { status: 400 })
    }

    // Video dosyası kontrolü
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: "Lütfen bir video dosyası seçin" }, { status: 400 })
    }

    // Dosya boyutu kontrolü (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: "Video dosyası 500MB'dan küçük olmalıdır" }, { status: 400 })
    }

    console.log('Firebase credentials check:', {
      apiKey: process.env.FIREBASE_API_KEY ? '✓' : '✗',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ? '✓' : '✗',
      projectId: process.env.FIREBASE_PROJECT_ID ? '✓' : '✗',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ? '✓' : '✗'
    })

    // Firebase Storage'a yükle
    const fileName = `videos/${Date.now()}-${file.name}`
    const storageRef = ref(storage, fileName)
    
    console.log('Uploading to Firebase Storage...')
    const snapshot = await uploadBytes(storageRef, file)
    console.log('Firebase upload success:', snapshot.metadata)
    
    // Download URL al
    const downloadURL = await getDownloadURL(storageRef)
    console.log('Firebase download URL:', downloadURL)
    
    // Lesson'ı güncelle
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          videoUrl: downloadURL,
          duration: Math.round(Math.random() * 60 + 30) // Geçici süre
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      videoUrl: downloadURL,
      fileName: fileName,
      message: "Video başarıyla Firebase Storage'a yüklendi" 
    })

  } catch (error) {
    console.error("=== FIREBASE VIDEO UPLOAD API ERROR ===")
    console.error("Firebase upload error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
