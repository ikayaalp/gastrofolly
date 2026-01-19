"use client";
import { useState, useEffect } from "react";
import { Plus, Trash, Play, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import Image from "next/image";

interface Course {
    id: string;
    title: string;
}

interface Story {
    id: string;
    mediaUrl: string;
    mediaType: string;
    duration: number;
    course?: { title: string };
    creator: { name: string };
    createdAt: string;
    expiresAt: string;
}

export default function AdminStoriesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [mediaType, setMediaType] = useState("IMAGE");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Auto detect type
            if (file.type.startsWith("video/")) {
                setMediaType("VIDEO");
            } else {
                setMediaType("IMAGE");
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu hikayeyi silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setStories(stories.filter(s => s.id !== id));
            } else {
                alert("Silme işlemi başarısız");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("media", selectedFile);
            formData.append("mediaType", mediaType);

            // Default duration: 5000ms for image, 15000ms for video if not specified
            // For video, optimally we would extract actual duration, but for MVP:
            const duration = mediaType === "VIDEO" ? "15000" : "5000";
            formData.append("duration", duration);

            if (selectedCourse) {
                formData.append("courseId", selectedCourse);
            }

            const res = await fetch("/api/stories", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                // Reset form
                setSelectedFile(null);
                setPreviewUrl(null);
                setSelectedCourse("");

                // Refresh list
                fetchData();
            } else {
                alert(data.error || "Yükleme başarısız");
            }

        } catch (error) {
            console.error("Upload error:", error);
            alert("Hata oluştu");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8">Hikaye Yönetimi</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Create Form */}
                <div className="md:col-span-1 bg-gray-900 p-6 rounded-xl border border-gray-800 h-fit">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">Yeni Hikaye Ekle</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* File Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Medya Dosyası (Resim/Video)</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 hover:border-orange-500 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {previewUrl ? (
                                            mediaType === "VIDEO" ? (
                                                <video src={previewUrl} className="h-40 w-full object-contain" controls />
                                            ) : (
                                                <img src={previewUrl} alt="Preview" className="h-40 w-full object-contain" />
                                            )
                                        ) : (
                                            <>
                                                <div className="mb-2 text-gray-400">
                                                    <Plus className="w-8 h-8 mx-auto mb-2" />
                                                </div>
                                                <p className="text-xs text-gray-400">PNG, JPG veya Video</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
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

                        <button
                            type="submit"
                            disabled={!selectedFile || uploading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all
                ${!selectedFile || uploading
                                    ? 'bg-gray-700 cursor-not-allowed'
                                    : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            {uploading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-5 h-5" /> Yükleniyor...
                                </div>
                            ) : "Hikayeyi Paylaş"}
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
                            {stories.map(story => (
                                <div key={story.id} className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                                    {/* Status Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 z-10" />

                                    {/* Media Preview */}
                                    <div className="aspect-[9/16] bg-black">
                                        {story.mediaType === "VIDEO" ? (
                                            <video src={story.mediaUrl} className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover opacity-80" />
                                        )}

                                        {/* Type Icon */}
                                        <div className="absolute top-3 left-3 bg-black/50 p-1.5 rounded-full">
                                            {story.mediaType === "VIDEO" ? (
                                                <Video className="w-4 h-4 text-white" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                                        {story.course && (
                                            <span className="text-xs text-orange-400 font-medium block mb-1 truncate">
                                                {story.course.title}
                                            </span>
                                        )}
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-400">
                                                {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(story.id)}
                                                className="p-1.5 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
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
        </div>
    );
}
