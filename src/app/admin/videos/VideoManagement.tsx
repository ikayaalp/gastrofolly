"use client"

import { useState } from "react"
import VideoUpload from "@/components/admin/VideoUpload"
import { Play, Upload, CheckCircle, AlertCircle, X, Search, Filter } from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "MISSING" | "HAS_VIDEO">("ALL")

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

  const filteredLessons = allLessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.course.title.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "ALL") return matchesSearch
    if (filterStatus === "MISSING") return matchesSearch && !lesson.videoUrl
    if (filterStatus === "HAS_VIDEO") return matchesSearch && lesson.videoUrl
    return matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Upload Modal */}
      {showUpload && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpload(false)} />

            <div className="relative bg-neutral-900 border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedLesson.title}</h2>
                    <p className="text-gray-400 text-sm flex items-center">
                      <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                      {selectedLesson.course.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
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
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lessonsWithoutVideos.length}</p>
              <p className="text-gray-400">Video Bekleyen</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
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

        <div className="bg-black border border-gray-800 rounded-xl p-6">
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

      {/* Search & filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Ders veya kurs ara..."
              className="w-full bg-black border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-black border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none min-w-[170px]"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="MISSING">Video Eksik</option>
              <option value="HAS_VIDEO">Video Yüklü</option>
            </select>
          </div>
        </div>
      </div>

      {/* Simplified List View */}
      <div className="space-y-4">
        {filteredLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="group bg-neutral-900/30 border border-white/5 hover:border-orange-500/30 hover:bg-neutral-900/50 rounded-xl p-4 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${lesson.videoUrl ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                {lesson.videoUrl ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors">{lesson.title}</h3>
                <p className="text-gray-500 text-sm flex items-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2"></span>
                  {lesson.course.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {lesson.videoUrl && (
                <div className="hidden md:block text-xs text-gray-600 font-mono bg-black/50 px-2 py-1 rounded max-w-[200px] truncate">
                  {lesson.videoUrl}
                </div>
              )}

              <button
                onClick={() => handleUploadClick(lesson)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm ${lesson.videoUrl
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20'
                  }`}
              >
                <Upload className="h-4 w-4" />
                <span>{lesson.videoUrl ? 'Değiştir' : 'Yükle'}</span>
              </button>
            </div>
          </div>
        ))}

        {filteredLessons.length === 0 && (
          <div className="text-center py-20 bg-neutral-900/50 border border-white/5 rounded-2xl">
            <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Ders bulunamadı</h3>
            <p className="text-gray-400 max-w-sm mx-auto">
              Arama kriterlerinize uygun ders bulunamadı.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
