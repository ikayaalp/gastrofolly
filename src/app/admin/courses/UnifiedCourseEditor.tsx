"use client"

import { useState, useEffect } from "react"
import { X, Save, Check, Plus, Edit, Trash2, Upload, Play, Clock, Layout, List, Settings } from "lucide-react"
import ImageUpload from "@/components/admin/ImageUpload"
import VideoUpload from "@/components/admin/VideoUpload"

interface Course {
    id: string
    title: string
    description: string
    imageUrl: string | null
    level: string
    duration: number | null
    isPublished: boolean
    accessibleByPlans: string[]
    category: {
        name: string
        id: string
    }
    instructor: {
        id: string
        name: string | null
        email: string
    }
    lessons: Lesson[]
}

interface Lesson {
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    duration: number | null
    order: number
    isFree: boolean
}

interface Category {
    id: string
    name: string
    description: string | null
    slug: string
}

interface Instructor {
    id: string
    name: string | null
    email: string
    image: string | null
}

interface UnifiedCourseEditorProps {
    course: Course | null // null = New Course
    categories: Category[]
    instructors: Instructor[]
    onClose: () => void
    onSaveSuccess: () => void
}

const SUBSCRIPTION_PLANS = [
    { id: 'COMMIS', label: 'Commis', color: 'bg-orange-500' },
    { id: 'CHEF_DE_PARTIE', label: 'Chef de Partie', color: 'bg-blue-500' },
    { id: 'EXECUTIVE', label: 'Executive Chef', color: 'bg-purple-500' }
]

export default function UnifiedCourseEditor({ course, categories, instructors, onClose, onSaveSuccess }: UnifiedCourseEditorProps) {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CURRICULUM' | 'SETTINGS'>(course ? 'GENERAL' : 'GENERAL')
    const [loading, setLoading] = useState(false)
    const [currentCourseId, setCurrentCourseId] = useState<string | null>(course?.id || null)

    // -- GENERAL INFO STATE --
    const [formData, setFormData] = useState({
        title: course?.title || "",
        description: course?.description || "",
        imageUrl: course?.imageUrl || "",
        level: course?.level || "BEGINNER",
        duration: course?.duration || 0,
        isPublished: course?.isPublished || false,
        categoryId: course?.category?.id || "",
        instructorId: course?.instructor?.id || "",
        accessibleByPlans: course?.accessibleByPlans || [] as string[]
    })

    // -- CURRICULUM STATE --
    const [lessons, setLessons] = useState<Lesson[]>(course?.lessons || [])
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null) // If null, we might be creating new or just showing list
    const [isLessonFormOpen, setIsLessonFormOpen] = useState(false)

    // Lesson Form State
    const [lessonForm, setLessonForm] = useState({
        title: "",
        description: "",
        videoUrl: "",
        duration: 0,
        order: 0,
        isFree: false
    })
    const [showVideoUploadForLessonId, setShowVideoUploadForLessonId] = useState<string | null>(null) // If set, showing upload modal for this lesson ID

    // -- HANDLERS: GENERAL --
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked
            : type === 'number' ? parseFloat(value) || 0
                : value

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }))
    }

    const handleImageUploaded = (imageUrl: string) => {
        setFormData(prev => ({ ...prev, imageUrl }))
    }

    const togglePlanAccess = (planId: string) => {
        setFormData(prev => {
            const currentPlans = prev.accessibleByPlans
            if (currentPlans.includes(planId)) {
                return { ...prev, accessibleByPlans: currentPlans.filter(p => p !== planId) }
            } else {
                return { ...prev, accessibleByPlans: [...currentPlans, planId] }
            }
        })
    }

    const saveGeneralInfo = async () => {
        setLoading(true)
        try {
            const url = currentCourseId
                ? `/api/admin/courses/${currentCourseId}`
                : '/api/admin/courses'

            const method = currentCourseId ? 'PUT' : 'POST'

            const payload = {
                ...formData,
                price: 0,
                isFree: false,
                discountRate: 0
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const data = await response.json()
                if (!currentCourseId) {
                    setCurrentCourseId(data.id) // If created new, set ID so we can add lessons
                    // Move to curriculum tab after creation
                    setActiveTab('CURRICULUM')
                } else {
                    // Just notify success implicitly or via toast (using alert for now)
                    // alert('Bilgiler güncellendi')
                }
                return true
            } else {
                const data = await response.json()
                alert(data.error || 'Kaydedilemedi')
                return false
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Hata oluştu')
            return false
        } finally {
            setLoading(false)
        }
    }

    // -- HANDLERS: LESSONS --
    const openLessonForm = (lesson?: Lesson) => {
        if (lesson) {
            setEditingLesson(lesson)
            setLessonForm({
                title: lesson.title,
                description: lesson.description || "",
                videoUrl: lesson.videoUrl || "",
                duration: lesson.duration || 0,
                order: lesson.order,
                isFree: lesson.isFree
            })
        } else {
            setEditingLesson(null)
            setLessonForm({
                title: "",
                description: "",
                videoUrl: "",
                duration: 0,
                order: lessons.length + 1,
                isFree: false
            })
        }
        setIsLessonFormOpen(true)
    }

    const saveLesson = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!currentCourseId) {
            alert("Önce kursu kaydetmelisiniz.")
            setActiveTab("GENERAL")
            return
        }

        try {
            const url = editingLesson
                ? `/api/admin/lessons/${editingLesson.id}`
                : '/api/admin/lessons'

            const method = editingLesson ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...lessonForm,
                    courseId: currentCourseId
                })
            })

            if (response.ok) {
                const savedLesson = await response.json()
                if (editingLesson) {
                    setLessons(prev => prev.map(l => l.id === savedLesson.id ? savedLesson : l))
                } else {
                    setLessons(prev => [...prev, savedLesson])
                }
                setIsLessonFormOpen(false)
            } else {
                alert('Ders kaydedilemedi')
            }
        } catch (error) {
            console.error(error)
            alert('Ders kaydedilirken hata')
        }
    }

    const deleteLesson = async (lessonId: string) => {
        if (!confirm('Silmek istiyor musunuz?')) return
        try {
            const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
            if (res.ok) {
                setLessons(prev => prev.filter(l => l.id !== lessonId))
            }
        } catch (e) { console.error(e) }
    }

    const handleVideoUploadedForLesson = async (videoUrl: string) => {
        // Just save this URL to the lesson directly
        if (!showVideoUploadForLessonId) return

        const lesson = lessons.find(l => l.id === showVideoUploadForLessonId)
        if (!lesson) return

        try {
            const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: lesson.title,
                    description: lesson.description,
                    videoUrl: videoUrl,
                    duration: lesson.duration, // Ideally update duration from video metadata if possible, skipping for simplicity here
                    order: lesson.order,
                    isFree: lesson.isFree
                })
            })

            if (response.ok) {
                setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, videoUrl } : l))
                setShowVideoUploadForLessonId(null)
            }
        } catch (e) { console.error(e) }
    }


    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-gray-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-neutral-900">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-white">
                            {currentCourseId ? formData.title || 'Kurs Düzenle' : 'Yeni Kurs Oluştur'}
                        </h2>
                        {currentCourseId && (
                            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${formData.isPublished ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>
                                {formData.isPublished ? 'YAYINDA' : 'TASLAK'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                saveGeneralInfo().then(success => {
                                    if (success) onSaveSuccess()
                                })
                            }}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm"
                        >
                            <Save className="h-4 w-4" />
                            <span>Kaydet</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Kapat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA WITH SIDEBAR */}
                <div className="flex-1 flex overflow-hidden">

                    {/* SIDEBAR TABS */}
                    <div className="w-64 bg-black/30 border-r border-gray-800 flex flex-col py-6 space-y-2 px-4">
                        <button
                            onClick={() => setActiveTab('GENERAL')}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'GENERAL' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Layout className="h-5 w-5" />
                            <span>Genel Bilgiler</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('CURRICULUM')}
                            disabled={!currentCourseId}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'CURRICULUM' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                        >
                            <List className="h-5 w-5" />
                            <span>Ders Programı</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('SETTINGS')}
                            disabled={!currentCourseId}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'SETTINGS' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                        >
                            <Settings className="h-5 w-5" />
                            <span>Ayarlar & Yayın</span>
                        </button>
                    </div>

                    {/* MAIN PANEL */}
                    <div className="flex-1 overflow-y-auto p-8 bg-neutral-900/50">

                        {/* TAB: GENERAL */}
                        {activeTab === 'GENERAL' && (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Kurs Başlığı</label>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                                                placeholder="Örn: İtalyan Mutfağı"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Kategori</label>
                                            <select
                                                name="categoryId"
                                                value={formData.categoryId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                                            >
                                                <option value="">Seçiniz...</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Zorluk Seviyesi</label>
                                            <select
                                                name="level"
                                                value={formData.level}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                                            >
                                                <option value="BEGINNER">Kolay</option>
                                                <option value="INTERMEDIATE">Orta</option>
                                                <option value="ADVANCED">Zor</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Eğitmen</label>
                                            <select
                                                name="instructorId"
                                                value={formData.instructorId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                                            >
                                                <option value="">Seçiniz...</option>
                                                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Kapak Görseli</label>
                                            <div className="bg-black border border-gray-800 rounded-xl p-4">
                                                <ImageUpload onImageUploaded={handleImageUploaded} currentImageUrl={formData.imageUrl} type="course" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Açıklama</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={5}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                                    />
                                </div>

                                {!currentCourseId && (
                                    <div className="flex justify-end">
                                        <button onClick={() => saveGeneralInfo()} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition">
                                            Kursu Oluştur ve İlerle &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* TAB: CURRICULUM */}
                        {activeTab === 'CURRICULUM' && (
                            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Ders Listesi</h3>
                                        <p className="text-gray-400 text-sm">Sürükle bırak yaparak sıralamayı değiştirebilirsiniz (Yakında)</p>
                                    </div>
                                    <button
                                        onClick={() => openLessonForm()}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Ders Ekle</span>
                                    </button>
                                </div>

                                {/* INLINE FORM FOR NEW/EDIT LESSON */}
                                {isLessonFormOpen && (
                                    <div className="bg-black border border-gray-800 rounded-xl p-6 mb-8 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-white">{editingLesson ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h4>
                                            <button onClick={() => setIsLessonFormOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input placeholder="Ders Başlığı" className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                                value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} />
                                            <div className="flex gap-2">
                                                <input type="number" placeholder="Süre (dk)" className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white w-24"
                                                    value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })} />
                                                <input type="number" placeholder="Sıra" className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white w-20"
                                                    value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })} />
                                                <div className="flex items-center space-x-2 px-2">
                                                    <input type="checkbox" checked={lessonForm.isFree} onChange={e => setLessonForm({ ...lessonForm, isFree: e.target.checked })} />
                                                    <span className="text-gray-400 text-sm">Ücretsiz</span>
                                                </div>
                                            </div>
                                            <textarea placeholder="Açıklama (Opsiyonel)" className="col-span-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white h-20"
                                                value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsLessonFormOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">İptal</button>
                                            <button onClick={(e) => saveLesson(e)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold">Kaydet</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                                        <div key={lesson.id} className="bg-neutral-800/30 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-neutral-800/50 transition duration-200">
                                            <div className="flex items-center space-x-4">
                                                <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">{lesson.order}</span>
                                                <div>
                                                    <h4 className="text-white font-medium">{lesson.title}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {lesson.duration} dk</span>
                                                        {lesson.isFree && <span className="text-green-400">Ücretsiz (Önizleme)</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                {lesson.videoUrl ? (
                                                    <div className="flex items-center space-x-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-mono border border-green-500/20">
                                                        <Play className="h-3 w-3" />
                                                        <span>Video Yüklü</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowVideoUploadForLessonId(lesson.id)}
                                                        className="flex items-center space-x-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <Upload className="h-3 w-3" />
                                                        <span>Video Yükle</span>
                                                    </button>
                                                )}

                                                <div className="h-6 w-px bg-gray-700 mx-2"></div>

                                                <button onClick={() => openLessonForm(lesson)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => deleteLesson(lesson.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {lessons.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                                            <p className="text-gray-500">Henüz hiç ders eklenmemiş.</p>
                                            <button onClick={() => openLessonForm()} className="mt-4 text-orange-500 hover:underline">İlk dersi ekle</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* TAB: SETTINGS & PUBLISH */}
                        {activeTab === 'SETTINGS' && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-black border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Erişim Yetkileri</h3>
                                    <div className="space-y-3">
                                        {SUBSCRIPTION_PLANS.map((plan) => (
                                            <label
                                                key={plan.id}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${formData.accessibleByPlans.includes(plan.id)
                                                    ? 'bg-orange-500/10 border-orange-500' // Selected
                                                    : 'bg-transparent border-gray-800 hover:bg-gray-900' // Unselected
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className={`w-3 h-3 rounded-full ${plan.color}`}></span>
                                                    <span className={`text-sm font-medium ${formData.accessibleByPlans.includes(plan.id) ? 'text-orange-500' : 'text-gray-400'}`}>{plan.label}</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${formData.accessibleByPlans.includes(plan.id)
                                                    ? 'bg-orange-500 border-orange-500 text-white'
                                                    : 'border-gray-600 bg-transparent'
                                                    }`}>
                                                    {formData.accessibleByPlans.includes(plan.id) && <Check className="h-4 w-4" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.accessibleByPlans.includes(plan.id)}
                                                    onChange={() => togglePlanAccess(plan.id)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-black border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Yayın Durumu</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">
                                            Kursu yayına almak için tüm dersleri tamamladığınızdan emin olun.
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.isPublished}
                                                onChange={e => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))} />
                                            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                            <span className="ml-3 text-sm font-medium text-white">{formData.isPublished ? 'YAYINDA' : 'TASLAK'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* OVERLAY MODAL FOR VIDEO UPLOAD */}
                {showVideoUploadForLessonId && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Video Yükle</h3>
                                <button onClick={() => setShowVideoUploadForLessonId(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                            </div>
                            <VideoUpload
                                lessonId={showVideoUploadForLessonId}
                                onVideoUploaded={handleVideoUploadedForLesson}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
