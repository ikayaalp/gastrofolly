"use client"

import { useState } from "react"
import { X, Plus, Edit, Trash2, Upload, Play, Clock } from "lucide-react"
import VideoUpload from "@/components/admin/VideoUpload"

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  duration: number | null
  order: number
  isFree: boolean
}

interface Course {
  id: string
  title: string
  lessons: Lesson[]
}

interface LessonManageModalProps {
  course: Course
  onClose: () => void
}

export default function LessonManageModal({ course, onClose }: LessonManageModalProps) {
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: 0,
    order: course.lessons.length + 1,
    isFree: false
  })
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const handleVideoUpload = (lessonId: string) => {
    setSelectedLessonId(lessonId)
    setShowVideoUpload(true)
  }

  const handleVideoUploaded = (videoUrl: string) => {
    setShowVideoUpload(false)
    setSelectedLessonId(null)
    window.location.reload()
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Bu dersi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Ders silinemedi')
      }
    } catch (error) {
      console.error('Delete lesson error:', error)
      alert('Bir hata oluştu')
    }
  }

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingLesson 
        ? `/api/admin/lessons/${editingLesson.id}`
        : '/api/admin/lessons'
      
      const method = editingLesson ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description,
          videoUrl: lessonForm.videoUrl || null,
          duration: lessonForm.duration,
          order: lessonForm.order,
          isFree: lessonForm.isFree,
          courseId: course.id
        })
      })

      if (response.ok) {
        setShowLessonForm(false)
        setEditingLesson(null)
        setLessonForm({
          title: "",
          description: "",
          videoUrl: "",
          duration: 0,
          order: course.lessons.length + 1,
          isFree: false
        })
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Ders kaydedilemedi')
      }
    } catch (error) {
      console.error('Save lesson error:', error)
      alert('Bir hata oluştu')
    }
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || 0,
      order: lesson.order,
      isFree: lesson.isFree || false
    })
    setShowLessonForm(true)
  }

  // Video upload handler for lesson form
  const handleVideoUploadInForm = async (file: File) => {
    setUploadingVideo(true)
    
    try {
      const formData = new FormData()
      formData.append('video', file)
      
      const response = await fetch('/api/upload-video-cloud', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setLessonForm(prev => ({ 
          ...prev, 
          videoUrl: data.videoUrl,
          duration: data.duration || prev.duration
        }))
        
        // Video süresini otomatik al
        const video = document.createElement('video')
        video.src = data.videoUrl
        video.onloadedmetadata = () => {
          const durationInMinutes = Math.round(video.duration / 60)
          setLessonForm(prev => ({ 
            ...prev, 
            duration: durationInMinutes 
          }))
        }
      } else {
        alert(data.error || 'Video yüklenemedi')
      }
    } catch (error) {
      console.error('Video upload error:', error)
      alert('Video yüklenirken hata oluştu')
    } finally {
      setUploadingVideo(false)
    }
  }

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Ders Yönetimi</h2>
                <p className="text-gray-400">{course.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">
                Dersler ({course.lessons.length})
              </h3>
              <button
                onClick={() => setShowLessonForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Ders</span>
              </button>
            </div>

            {/* Lessons List */}
            <div className="space-y-4">
              {course.lessons.map((lesson) => (
                <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-medium">
                          {lesson.order}
                        </span>
                        <h4 className="font-semibold text-white">{lesson.title}</h4>
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
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(lesson.duration)}</span>
                        </div>
                        {lesson.videoUrl && (
                          <span className="font-mono text-xs">{lesson.videoUrl}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editLesson(lesson)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                        title="Dersi Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleVideoUpload(lesson.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                        title="Video Yükle"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteLesson(lesson.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                        title="Dersi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Video Upload Modal */}
            {showVideoUpload && selectedLessonId && (
              <div className="fixed inset-0 z-60 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowVideoUpload(false)} />
                  
                  <div className="relative bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-w-2xl w-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Video Yükle</h3>
                        <button
                          onClick={() => setShowVideoUpload(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <VideoUpload 
                        onVideoUploaded={handleVideoUploaded}
                        lessonId={selectedLessonId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Form Modal */}
            {showLessonForm && (
              <div className="fixed inset-0 z-60 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLessonForm(false)} />
                  
                  <div className="relative bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-w-2xl w-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">
                          {editingLesson ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowLessonForm(false)
                            setEditingLesson(null)
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <form onSubmit={saveLesson} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ders Başlığı *
                          </label>
                          <input
                            type="text"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                            placeholder="Ders başlığını girin"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Açıklama
                          </label>
                          <textarea
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none"
                            placeholder="Ders açıklaması..."
                          />
                        </div>

                        {/* Video Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ders Videosu
                          </label>
                          
                          {lessonForm.videoUrl ? (
                            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-green-500/20 p-2 rounded">
                                    <Play className="h-4 w-4 text-green-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">Video yüklendi</p>
                                    <p className="text-gray-400 text-sm font-mono">{lessonForm.videoUrl}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLessonForm(prev => ({ ...prev, videoUrl: "", duration: 0 }))}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleVideoUploadInForm(file)
                                }}
                                className="hidden"
                                id="video-upload"
                                disabled={uploadingVideo}
                              />
                              
                              {uploadingVideo ? (
                                <div className="space-y-3">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                  <p className="text-gray-400">Video yükleniyor ve süre hesaplanıyor...</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                                  <div>
                                    <label
                                      htmlFor="video-upload"
                                      className="cursor-pointer text-orange-500 hover:text-orange-400 font-medium"
                                    >
                                      Video dosyası seçin
                                    </label>
                                    <p className="text-gray-400 text-sm mt-1">
                                      MP4, MOV, AVI formatları (Max: 500MB)
                                      <br />
                                      Video süresi otomatik hesaplanacak
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Süre (dakika)
                            </label>
                            <input
                              type="number"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                              min="0"
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                              placeholder="45"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Sıra
                            </label>
                            <input
                              type="number"
                              value={lessonForm.order}
                              onChange={(e) => setLessonForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                              min="1"
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={lessonForm.isFree}
                            onChange={(e) => setLessonForm(prev => ({ ...prev, isFree: e.target.checked }))}
                            className="w-5 h-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                          />
                          <label className="text-gray-300">
                            Ücretsiz ders (önizleme için)
                          </label>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowLessonForm(false)
                              setEditingLesson(null)
                            }}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            {editingLesson ? 'Güncelle' : 'Oluştur'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
