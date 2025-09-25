"use client"

import { useState } from "react"
import VideoUpload from "@/components/admin/VideoUpload"
import { Play, Upload, CheckCircle, AlertCircle } from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  duration: number | null
  order: number
  course: {
    id: string
    title: string
  }
}

interface VideoManagementProps {
  lessonsWithoutVideos: Lesson[]
  allLessons: Lesson[]
}

export default function VideoManagement({ lessonsWithoutVideos, allLessons }: VideoManagementProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleVideoUploaded = (videoUrl: string) => {
    console.log("Video uploaded:", videoUrl)
    setShowUpload(false)
    setSelectedLesson(null)
    setRefreshKey(prev => prev + 1)
    
    // Sayfayı yenile
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleUploadClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setShowUpload(true)
  }

  return (
    <div className="space-y-8">
      {/* Upload Modal */}
      {showUpload && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
            
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedLesson.title}</h2>
                    <p className="text-gray-400">{selectedLesson.course.title}</p>
                  </div>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <VideoUpload 
                  onVideoUploaded={handleVideoUploaded}
                  lessonId={selectedLesson.id}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lessonsWithoutVideos.length}</p>
              <p className="text-gray-400">Video Bekleyen Ders</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{allLessons.length - lessonsWithoutVideos.length}</p>
              <p className="text-gray-400">Videolu Ders</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Play className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{allLessons.length}</p>
              <p className="text-gray-400">Toplam Ders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Without Videos */}
      {lessonsWithoutVideos.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span>Video Bekleyen Dersler ({lessonsWithoutVideos.length})</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {lessonsWithoutVideos.map((lesson) => (
              <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{lesson.title}</h3>
                  <p className="text-gray-400 text-sm">{lesson.course.title}</p>
                  {lesson.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{lesson.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleUploadClick(lesson)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Video Yükle</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Lessons */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Tüm Dersler</h2>
        
        <div className="space-y-4">
          {allLessons.map((lesson) => (
            <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-white">{lesson.title}</h3>
                  {lesson.videoUrl ? (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                      ✓ Video Var
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium">
                      Video Yok
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{lesson.course.title}</p>
                {lesson.videoUrl && (
                  <p className="text-gray-500 text-xs mt-1 font-mono">{lesson.videoUrl}</p>
                )}
              </div>
              
              <button
                onClick={() => handleUploadClick(lesson)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{lesson.videoUrl ? 'Video Değiştir' : 'Video Yükle'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
