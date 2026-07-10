"use client";
import { useState, useEffect } from "react";
import { Plus, Trash, Play, Image as ImageIcon, Video, Loader2, ArrowUp, ArrowDown, Edit2, X } from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

interface Course {
    id: string;
    title: string;
}

interface Story {
    id: string;
    title?: string;
    coverImage?: string;
    mediaUrl: string;
    mediaType: string;
    duration: number;
    courseId?: string;
    course?: { title: string };
    creator: { name: string };
    createdAt: string;
    expiresAt: string;
    order: number;
}

export default function AdminStoriesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [mediaType, setMediaType] = useState("IMAGE");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

    // Edit State
    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

    // Confirmation Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropTarget, setCropTarget] = useState<'main' | 'cover' | null>(null);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, storiesRes] = await Promise.all([
                fetch("/api/courses"), // Need simple list of courses
                fetch("/api/stories")
            ]);

            const coursesData = await coursesRes.json();
            const storiesData = await storiesRes.json();

            if (coursesData && Array.isArray(coursesData)) {
                setCourses(coursesData);
            }

            if (storiesData.success) {
                setStories(storiesData.stories);
            }

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith("video/");
            if (isVideo) {
                setSelectedFile(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                setMediaType("VIDEO");
            } else {
                setMediaType("IMAGE");
                setCropTarget('main');
                setCropImageSrc(URL.createObjectURL(file));
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setShowCropModal(true);
            }
        }
    };

    // New handler for cover image
    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCropTarget('cover');
            setCropImageSrc(URL.createObjectURL(file));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setShowCropModal(true);
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async () => {
        if (!cropImageSrc || !croppedAreaPixels) return;
        try {
            const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            if (!croppedFile) return;

            const url = URL.createObjectURL(croppedFile);
            if (cropTarget === 'main') {
                setSelectedFile(croppedFile);
                setPreviewUrl(url);
            } else if (cropTarget === 'cover') {
                setSelectedCoverFile(croppedFile);
                setCoverPreviewUrl(url);
            }
            setShowCropModal(false);
            setCropImageSrc(null);
            setCropTarget(null);
        } catch (e) {
            console.error("Crop error:", e);
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setCropImageSrc(null);
        setCropTarget(null);
    };

    const handleDeleteClick = (id: string) => {
        setStoryToDelete(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!storyToDelete) return;

        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/stories/${storyToDelete}`, { method: "DELETE" });
            if (res.ok) {
                setStories(stories.filter(s => s.id !== storyToDelete));
            } else {
                alert("Silme işlemi başarısız");
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
            setStoryToDelete(null);
        }
    };

    const handleEditClick = (story: Story) => {
        setEditingStoryId(story.id);
        setTitle(story.title || "");
        setSelectedCourse(story.courseId || "");
        setSelectedFile(null);
        setPreviewUrl(story.mediaUrl);
        setMediaType(story.mediaType);
        setSelectedCoverFile(null);
        setCoverPreviewUrl(story.coverImage || null);
    };

    const handleCancelEdit = () => {
        setEditingStoryId(null);
        setTitle("");
        setSelectedCourse("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedCoverFile(null);
        setCoverPreviewUrl(null);
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === stories.length - 1) return;

        const newStories = [...stories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        const temp = newStories[index];
        newStories[index] = newStories[targetIndex];
        newStories[targetIndex] = temp;
        
        setStories(newStories);

        try {
            const res = await fetch('/api/stories/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyIds: newStories.map(s => s.id) })
            });
            if (!res.ok) {
                throw new Error("Sıralama güncellenemedi");
            }
        } catch (error) {
            console.error("Reorder error:", error);
            alert("Sıralama güncellenirken hata oluştu");
            fetchData();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStoryId && !selectedFile) return;

        try {
            setUploading(true);

            // 1. Get Cloudinary Config
            const configRes = await fetch('/api/admin/cloudinary-config');
            if (!configRes.ok) throw new Error('Cloudinary konfigürasyonu alınamadı');
            const { cloudName, uploadPreset } = await configRes.json();

            // Helper for client-side chunked upload
            const uploadToCloudinary = async (file: File) => {
                const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
                const chunkSize = 6 * 1024 * 1024; // 6MB chunks
                const totalChunks = Math.ceil(file.size / chunkSize);
                const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                if (file.size <= chunkSize) {
                    // Small file - standard upload
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', uploadPreset);
                    formData.append('folder', 'stories');

                    return new Promise<string>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', url);
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                setUploadProgress(Math.round((e.loaded / e.total) * 100));
                            }
                        };
                        xhr.onload = () => {
                            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
                            else {
                                try {
                                    const err = JSON.parse(xhr.responseText);
                                    reject(new Error(err.error?.message || `Yükleme başarısız (${xhr.status})`));
                                } catch {
                                    // If not JSON, show raw text or status
                                    const rawMsg = xhr.responseText ? xhr.responseText.substring(0, 100) : xhr.statusText;
                                    reject(new Error(`Yükleme hatası (${xhr.status}): ${rawMsg}`));
                                }
                            }
                        };
                        xhr.onerror = () => reject(new Error('Ağ hatası'));
                        xhr.send(formData);
                    });
                }

                // Large file - Chunked upload
                let lastResult = '';
                for (let i = 0; i < totalChunks; i++) {
                    const start = i * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunk = file.slice(start, end);

                    const formData = new FormData();
                    formData.append('file', chunk);
                    formData.append('upload_preset', uploadPreset);
                    formData.append('folder', 'stories');

                    const result = await new Promise<any>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', url);
                        xhr.setRequestHeader('X-Unique-Upload-Id', uniqueId);
                        xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${file.size}`);

                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                const chunkProgress = e.loaded / e.total;
                                const totalProgress = Math.round(((i + chunkProgress) / totalChunks) * 100);
                                setUploadProgress(totalProgress);
                            }
                        };

                        xhr.onload = () => {
                            if (xhr.status === 200 || xhr.status === 201) resolve(JSON.parse(xhr.responseText));
                            else {
                                try {
                                    const err = JSON.parse(xhr.responseText);
                                    reject(new Error(`Parça ${i + 1} hatası: ${err.error?.message || xhr.status}`));
                                } catch {
                                    const rawMsg = xhr.responseText ? xhr.responseText.substring(0, 100) : xhr.statusText;
                                    reject(new Error(`Parça ${i + 1} hatası (${xhr.status}): ${rawMsg}`));
                                }
                            }
                        };
                        xhr.onerror = () => reject(new Error('Ağ hatası oluştu'));
                        xhr.send(formData);
                    });
                    lastResult = result.secure_url;
                }
                return lastResult;
            };

            // 2. Upload Files to Cloudinary (if selected)
            let mediaUrl = editingStoryId ? previewUrl : null;
            if (selectedFile) {
                mediaUrl = await uploadToCloudinary(selectedFile);
            }
            
            let coverImageUrl = editingStoryId && coverPreviewUrl && !selectedCoverFile ? coverPreviewUrl : null;
            if (selectedCoverFile) {
                setUploadProgress(0);
                coverImageUrl = await uploadToCloudinary(selectedCoverFile);
            }

            // 3. Save to Database
            if (editingStoryId) {
                const res = await fetch(`/api/stories/${editingStoryId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        coverImage: coverImageUrl,
                        courseId: selectedCourse,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    handleCancelEdit();
                    fetchData();
                } else {
                    alert(data.error || "Güncelleme başarısız");
                }
            } else {
                const res = await fetch("/api/stories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mediaUrl,
                        mediaType,
                        title,
                        coverImage: coverImageUrl,
                        courseId: selectedCourse,
                        duration: mediaType === "VIDEO" ? 15000 : 5000
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    setSelectedFile(null);
                    setSelectedCoverFile(null);
                    setPreviewUrl(null);
                    setCoverPreviewUrl(null);
                    setTitle("");
                    setSelectedCourse("");
                    fetchData();
                } else {
                    alert(data.error || "Veritabanı kaydı başarısız");
                }
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert(error instanceof Error ? error.message : "Hata oluştu");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8">Hikaye Yönetimi</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Create/Edit Form */}
                <div className="md:col-span-1 bg-gray-900 p-6 rounded-xl border border-gray-800 h-fit">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
                        <h2 className="text-xl font-semibold">{editingStoryId ? "Hikayeyi Düzenle" : "Yeni Hikaye Ekle"}</h2>
                        {editingStoryId && (
                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Başlık (Opsiyonel)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Örn: Haftanın Tarifi"
                                className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-orange-500 outline-none"
                            />
                        </div>

                        {/* File Input (Main Media) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Medya Dosyası (Resim/Video)</label>
                            <p className="text-xs text-gray-500 mb-2">
                                Story'ler 9:16 (dikey) oranında tam ekran gösterilir. Farklı oranlı görseller kırpılır — 
                                aşağıdaki araçla nasıl kırpılacağını kendin seçebilirsin. (Video kırpma desteklenmez.)
                            </p>
                            <div className="flex items-center justify-center w-full">
                                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 ${!editingStoryId ? 'border-dashed cursor-pointer hover:bg-gray-700 hover:border-orange-500' : ''} rounded-lg bg-gray-800 transition-all overflow-hidden relative`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {previewUrl ? (
                                            mediaType === "VIDEO" ? (
                                                <video src={previewUrl} className="h-28 w-full object-contain" controls={!editingStoryId} muted />
                                            ) : (
                                                <img src={previewUrl} alt="Preview" className="h-28 w-full object-contain" />
                                            )
                                        ) : (
                                            <>
                                                <div className="mb-2 text-gray-400">
                                                    <Plus className="w-8 h-8 mx-auto mb-2" />
                                                </div>
                                                <p className="text-xs text-gray-400">Medya Seç</p>
                                            </>
                                        )}
                                    </div>
                                    {!editingStoryId && <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />}
                                </label>
                            </div>
                            {editingStoryId && <p className="text-xs text-orange-400 mt-2">Düzenleme modunda medya değiştirilemez.</p>}
                        </div>

                        {/* Cover Image Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Kapak Resmi (Opsiyonel)</label>
                            <p className="text-xs text-gray-500 mb-2">
                                Listenin başında görünecek yuvarlak resim (1:1 oranlı). Seçilmezse medya kullanılır.
                                Farklı oranlı görseller otomatik kırpılır — araçla seçebilirsin.
                            </p>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 hover:border-orange-500 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                        {coverPreviewUrl ? (
                                            <img src={coverPreviewUrl} alt="Cover Preview" className="h-20 w-full object-contain" />
                                        ) : (
                                            <>
                                                <div className="mb-1 text-gray-400">
                                                    <ImageIcon className="w-5 h-5 mx-auto" />
                                                </div>
                                                <p className="text-xs text-gray-400">Kapak Seç</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverSelect} />
                                </label>
                            </div>
                        </div>

                        {/* Course Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">İlgili Kurs (Opsiyonel)</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-orange-500 outline-none"
                            >
                                <option value="">Kurs Seçiniz...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Kullanıcı hikayeyi yukarı kaydırdığında bu kursa yönlendirilecek.
                            </p>
                        </div>

                        {uploading && (
                            <div className="mt-2 space-y-2">
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-center text-gray-400">%{uploadProgress} Yüklendi</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={(!selectedFile && !editingStoryId) || uploading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all
                ${(!selectedFile && !editingStoryId) || uploading
                                    ? 'bg-gray-700 cursor-not-allowed mt-4'
                                    : 'bg-orange-600 hover:bg-orange-700 mt-4'}`}
                        >
                            {uploading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-5 h-5" /> İşleniyor...
                                </div>
                            ) : editingStoryId ? "Güncelle" : "Hikayeyi Paylaş"}
                        </button>
                    </form>
                </div>

                {/* Stories List */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Aktif Hikayeler</h2>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
                        </div>
                    ) : stories.length === 0 ? (
                        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500 border border-gray-800">
                            Aktif hikaye bulunmuyor.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stories.map((story, idx) => (
                                <div key={story.id} className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex flex-col">
                                    {/* Status Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 z-10" />

                                    {/* Media Preview */}
                                    <div className="aspect-[9/16] bg-black relative">
                                        {story.mediaType === "VIDEO" ? (
                                            <video src={story.mediaUrl} className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover opacity-80" />
                                        )}

                                        {/* Type Icon */}
                                        <div className="absolute top-3 left-3 bg-black/50 p-1.5 rounded-full z-10">
                                            {story.mediaType === "VIDEO" ? (
                                                <Video className="w-4 h-4 text-white" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Overlay */}
                                    <div className="absolute bottom-12 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8 pointer-events-none">
                                        {story.title && (
                                            <span className="text-sm font-bold block truncate">
                                                {story.title}
                                            </span>
                                        )}
                                        {story.course && (
                                            <span className="text-xs text-orange-400 font-medium block mb-1 truncate">
                                                {story.course.title}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Action Buttons (Always visible at bottom) */}
                                    <div className="flex items-center justify-between bg-gray-800 p-2 z-10">
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleMove(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Yukarı Taşı"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMove(idx, 'down')}
                                                disabled={idx === stories.length - 1}
                                                className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Aşağı Taşı"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditClick(story)}
                                                className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(story.id)}
                                                className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                                                title="Sil"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Hikayeyi Sil"
                message="Bu hikayeyi kalıcı olarak silmek istediğinize emin misiniz? (Medya dosyası da silinecektir)"
                confirmText="Sil"
                cancelText="İptal"
                onConfirm={handleConfirmDelete}
                onClose={() => setShowDeleteModal(false)}
                isLoading={deleteLoading}
            />

            {/* Crop Modal */}
            {showCropModal && cropImageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-gray-900 rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Görseli Kırp</h3>
                            <button onClick={handleCropCancel} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative w-full h-[60vh] bg-black">
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropTarget === 'main' ? 9 / 16 : 1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={handleCropCancel}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                            >
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
