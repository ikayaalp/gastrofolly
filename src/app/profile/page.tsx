'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, User, Mail, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || '');
            setImage(session.user.image || '');
        }
    }, [session]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Dosya boyutu kontrolü (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Attemping profile photo upload...');
            const res = await fetch('/api/forum/upload-media', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Upload API reported error:', data);
                throw new Error(data.error || 'Yükleme başarısız');
            }

            console.log('Upload successful:', data.mediaUrl);
            setImage(data.mediaUrl);
            toast.success('Fotoğraf yüklendi');
        } catch (error: any) {
            console.error('Frontend upload error:', error);
            toast.error(error.message || 'Fotoğraf yüklenirken hata oluştu');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/user/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, image }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');

            // Session'ı güncelle
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: data.user.name,
                    image: data.user.image,
                },
            });

            toast.success('Profil başarıyla güncellendi');
            router.refresh();
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Profil güncellenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-800">
                    <h1 className="text-3xl font-bold text-white mb-8">Profili Düzenle</h1>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-600 bg-zinc-800 relative">
                                    {image ? (
                                        <Image
                                            src={image}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-4xl font-bold">
                                            {name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-0 right-0 bg-orange-600 p-2 rounded-full border-4 border-zinc-900 hover:bg-orange-700 transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-white" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center sm:text-left pt-2">
                                <h3 className="text-lg font-medium text-white">Profil Fotoğrafı</h3>
                                <p className="text-zinc-400 text-sm mt-1">
                                    JPG, PNG veya GIF. Maksimum 10MB.
                                </p>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Ad Soyad
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 bg-black border border-zinc-800 rounded-lg py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
                                        placeholder="Adınız Soyadınız"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    E-posta
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="block w-full pl-10 bg-zinc-950 border border-zinc-800 rounded-lg py-3 text-zinc-500 cursor-not-allowed"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-zinc-500">
                                    E-posta adresi güvenlik nedeniyle değiştirilemez.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
