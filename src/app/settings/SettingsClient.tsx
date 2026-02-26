"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, Calendar, Award, Crown } from "lucide-react"
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface UserData {
  id: string
  name: string | null
  email: string
  phoneNumber: string | null
  image: string | null
  role: string
  createdAt: Date
  subscriptionPlan: string | null
  subscriptionStartDate: Date | null
  subscriptionEndDate: Date | null
  subscriptionCancelled: boolean
  _count: {
    enrollments: number
    reviews: number
    payments: number
  }
}

interface SettingsClientProps {
  user: UserData
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const { data: session, update } = useSession()
  const router = useRouter()

  // Modal States
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    image: user.image || ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya tipini kontrol et
      if (!file.type.startsWith('image/')) {
        setMessage("Lütfen sadece resim dosyası seçin")
        return
      }

      // Dosya boyutunu kontrol et (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setMessage("Dosya boyutu 50MB'dan küçük olmalıdır")
        return
      }

      setSelectedFile(file)

      // Preview oluştur
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setMessage("")
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      let imageUrl = profileData.image

      // Eğer dosya seçildiyse: Hybrid Upload Strategy (Direct Cloudinary + Server Fallback)
      if (selectedFile) {
        let uploadSuccess = false;
        let uploadedUrl = '';

        // 1. Direct Upload Strategy
        try {
          console.log('Fetching Cloudinary params...');
          let cloudConfig;
          try {
            const configRes = await fetch('/api/auth/cloudinary-params');
            if (configRes.ok) cloudConfig = await configRes.json();
          } catch (err) { console.warn('Config fetch failed', err); }

          if (cloudConfig?.cloudName && cloudConfig?.uploadPreset) {
            console.log('Attempting Direct Upload...');
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', cloudConfig.uploadPreset);
            formData.append('folder', 'profile-images');

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudConfig.cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            });

            const uploadData = await uploadRes.json();
            if (uploadRes.ok) {
              uploadedUrl = uploadData.secure_url;
              uploadSuccess = true;
              console.log('Direct upload success');
            } else {
              console.error('Direct upload failed:', uploadData);
            }
          }
        } catch (directErr) {
          console.error('Direct upload exception:', directErr);
        }

        // 2. Fallback to Server Proxy (if direct failed and file is small enough)
        if (!uploadSuccess) {
          if (selectedFile.size < 4.5 * 1024 * 1024) {
            console.log('Attempting Server Proxy Fallback...');
            const formData = new FormData();
            formData.append('file', selectedFile);

            const proxyRes = await fetch('/api/forum/upload-media', {
              method: 'POST',
              body: formData
            });
            const proxyData = await proxyRes.json();

            if (proxyRes.ok) {
              uploadedUrl = proxyData.mediaUrl;
              uploadSuccess = true;
              console.log('Server proxy success');
            } else {
              throw new Error(proxyData.error || 'Yükleme başarısız');
            }
          } else {
            throw new Error('Dosya yüklenemedi. Doğrudan yükleme başarısız oldu ve dosya sunucu limiti için çok büyük.');
          }
        }

        if (uploadSuccess) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileData.name,
          phoneNumber: profileData.phoneNumber,
          image: imageUrl
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Profil başarıyla güncellendi!")

        // Session'ı güncelle
        await update({
          ...session,
          user: {
            ...session?.user,
            image: imageUrl,
            name: profileData.name
          }
        })

        router.refresh() // Sayfayı yenile (server component'leri güncellemek için)

        setSelectedFile(null)
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(data.error || "Profil güncellenemedi")
      }
    } catch (error: any) {
      console.error("Profile update error:", error)
      setMessage(error.message || "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Yeni şifreler eşleşmiyor")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Şifre başarıyla değiştirildi!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(data.error || "Şifre değiştirilemedi")
      }
    } catch (error) {
      console.error("Password change error:", error)
      setMessage("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Yönetici'
      case 'INSTRUCTOR': return 'Eğitmen'
      default: return 'Öğrenci'
    }
  }

  const tabs = [
    { id: "profile", name: "Profil Bilgileri", icon: User },
    { id: "subscription", name: "Premium", icon: Crown },
    { id: "password", name: "Şifre Değiştir", icon: Lock },
    { id: "account", name: "Hesap Bilgileri", icon: Award }
  ]

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/iyzico/cancel-subscription', {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('Aboneliğiniz başarıyla iptal edildi. Dönem sonuna kadar kullanmaya devam edebilirsiniz.')
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setMessage(data.error || 'Abonelik iptal edilemedi.')
      }
    } catch (error) {
      console.error('Cancel sub error:', error)
      setMessage('Bir hata oluştu')
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="border-b border-gray-800 overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-8 px-4 md:px-0 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('başarıyla')
          ? 'bg-green-900/50 border border-green-700 text-green-400'
          : 'bg-red-900/50 border border-red-700 text-red-400'
          }`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Profil Bilgileri</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profil"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {profileData.name
                      ? profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : <User className="h-10 w-10 text-white" />}
                  </span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-start gap-2">
                  <label
                    htmlFor="profile-image"
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Fotoğraf Seç</span>
                  </label>
                  {profileData.image && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium px-1"
                    >
                      Fotoğrafı Kaldır
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG formatları desteklenir (Max 50MB)</p>
                {selectedFile && (
                  <p className="text-green-400 text-sm mt-1">
                    Seçilen dosya: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 bg-[#111] border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed placeholder-gray-600"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>


            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        </div >
      )
      }

      {
        activeTab === "subscription" && (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Premium Üyelik Bilgileri</h2>

            {user.subscriptionPlan ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-600 rounded-full p-3">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{user.subscriptionPlan}</h3>
                        <p className="text-orange-400 text-sm font-medium">Aktif Premium</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-orange-500/20 pt-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Başlangıç Tarihi</p>
                      <p className="text-white font-medium">
                        {user.subscriptionStartDate ? formatDate(user.subscriptionStartDate) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Bitiş Tarihi</p>
                      <p className="text-white font-medium">
                        {user.subscriptionEndDate ? formatDate(user.subscriptionEndDate) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-2">Premium Bilgileri</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Premium üyeliğiniz {user.subscriptionEndDate ? formatDate(user.subscriptionEndDate) : '-'} tarihine kadar geçerlidir. {user.subscriptionCancelled ? 'Aboneliğiniz iptal edilmiştir. Süre sonunda yenilenmeyecektir.' : 'Süre sonunda iptal etmediğiniz sürece üyeliğiniz yenilenecektir.'}
                  </p>

                  {!user.subscriptionCancelled && (
                    <div className="mt-6 pt-6 border-t border-gray-800 flex justify-end">
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors px-4 py-2 border border-red-900/50 hover:bg-red-900/20 rounded-lg"
                      >
                        Aboneliği İptal Et
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
                <div className="bg-gray-800 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Premium Üyelik Bulunamadı</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Henüz Premium üye değilsiniz. Ayrıcalıklı içeriklere erişmek için hemen Premium olun.
                </p>
                <button
                  onClick={() => router.push('/subscription')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Premium Ol
                </button>
              </div>
            )}
          </div>
        )
      }

      {
        activeTab === "password" && (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Şifre Değiştir</h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 pr-10 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Mevcut şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 pr-10 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Yeni şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yeni Şifre Tekrar
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 pr-10 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                  <span>Şifreyi Değiştir</span>
                </button>
              </div>
            </form>
          </div>
        )
      }

      {
        activeTab === "account" && (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Hesap Bilgileri</h2>

            <div className="space-y-6">
              {/* Hesap İstatistikleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/20 p-2 rounded">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{user._count.enrollments}</p>
                      <p className="text-gray-400 text-sm">Kayıtlı Kurs</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-500/20 p-2 rounded">
                      <Award className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{user._count.reviews}</p>
                      <p className="text-gray-400 text-sm">Değerlendirme</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hesap Detayları */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Hesap Detayları</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kullanıcı ID
                    </label>
                    <p className="text-white font-mono text-sm bg-gray-700 px-3 py-2 rounded">
                      {user.id}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Hesap Türü
                    </label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                      user.role === 'INSTRUCTOR' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                      {getRoleName(user.role)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kayıt Tarihi
                    </label>
                    <p className="text-white">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      E-posta Durumu
                    </label>
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-500/20 text-green-400">
                      Doğrulanmış
                    </span>
                  </div>
                </div>
              </div>

              {/* Tehlikeli İşlemler */}
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Tehlikeli İşlemler</h3>
                <p className="text-gray-400 mb-4">
                  Bu işlemler geri alınamaz. Dikkatli olun.
                </p>

                <button
                  type="button"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  onClick={() => setShowAccountDeleteModal(true)}
                >
                  {loading ? 'Siliniyor...' : 'Hesabı Sil'}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Photo Remove Modal */}
      <ConfirmationModal
        isOpen={showAccountDeleteModal}
        onClose={() => setShowAccountDeleteModal(false)}
        onConfirm={async () => {
          setLoading(true)
          try {
            const response = await fetch('/api/user/delete-account', {
              method: 'DELETE'
            })

            if (response.ok) {
              // Hesap silindi, çıkış yap ve ana sayfaya yönlendir
              const { signOut } = await import('next-auth/react')
              await signOut({ callbackUrl: '/' })
            } else {
              const data = await response.json()
              setMessage(data.error || 'Hesap silinemedi')
            }
          } catch (error) {
            console.error('Delete account error:', error)
            setMessage('Bir hata oluştu')
          } finally {
            setLoading(false)
            setShowAccountDeleteModal(false)
          }
        }}
        title="Hesabı Kalıcı Olarak Sil"
        message="Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz (kurslar, yorumlar, ilerleme durumları) silinecektir."
        confirmText="Evet, Hesabımı Sil"
        isDanger={true}
        isLoading={loading}
      />



      {/* Photo Remove Modal */}
      <ConfirmationModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onConfirm={async () => {
          setLoading(true);
          try {
            // Call update API directly with null image
            const response = await fetch("/api/user/update-profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: profileData.name,
                phoneNumber: profileData.phoneNumber,
                image: null
              })
            });

            if (response.ok) {
              const data = await response.json();
              setProfileData(prev => ({ ...prev, image: "" }));
              setPreviewUrl(null);
              // Update session
              await update({
                ...session,
                user: { ...session?.user, image: null }
              });
              setMessage("Fotoğraf kaldırıldı");
              setTimeout(() => setMessage(""), 3000);
              setShowPhotoModal(false);
            } else {
              setMessage("Fotoğraf kaldırılamadı");
            }
          } catch (e) {
            setMessage("Bir hata oluştu");
          } finally {
            setLoading(false);
          }
        }}
        title="Profil Fotoğrafını Kaldır"
        message="Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?"
        confirmText="Evet, Kaldır"
        isDanger={true}
        isLoading={loading}
      />

      {/* Subscription Cancel Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Aboneliği İptal Et"
        message="Premium aboneliğinizi iptal etmek istediğinize emin misiniz? Dönem sonuna kadar Premium özelliklerini kullanmaya devam edebileceksiniz."
        confirmText="Evet, İptal Et"
        isDanger={true}
        isLoading={isCancelling}
      />

    </div >
  )
}

