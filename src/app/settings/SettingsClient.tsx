"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, Calendar, Award } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
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
  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email,
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

      // Dosya boyutunu kontrol et (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Dosya boyutu 5MB'dan küçük olmalıdır")
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

      // Eğer dosya seçildiyse önce Firebase'e yükle
      if (selectedFile) {
        // Dosya uzantısını al
        const fileExtension = selectedFile.name.split('.').pop()
        const fileName = `profile-${user.id}-${Date.now()}.${fileExtension}`
        const storageRef = ref(storage, `profile-images/${user.id}/${fileName}`)

        // Dosyayı yükle
        const snapshot = await uploadBytes(storageRef, selectedFile)

        // Download URL'ini al
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileData,
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
    } catch (error) {
      console.error("Profile update error:", error)
      setMessage("Bir hata oluştu")
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
    { id: "password", name: "Şifre Değiştir", icon: Lock },
    { id: "account", name: "Hesap Bilgileri", icon: Award }
  ]

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
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
                  <User className="h-10 w-10 text-white" />
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
                <label
                  htmlFor="profile-image"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Fotoğraf Seç</span>
                </label>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG formatları desteklenir (Max 5MB)</p>
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
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="ornek@email.com"
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
        </div>
      )}

      {activeTab === "password" && (
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
      )}

      {activeTab === "account" && (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Hesap Bilgileri</h2>

          <div className="space-y-6">
            {/* Hesap İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500/20 p-2 rounded">
                    <Calendar className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{user._count.payments}</p>
                    <p className="text-gray-400 text-sm">Ödeme</p>
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
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => {
                  if (confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                    // Hesap silme API'si çağrılabilir
                    alert('Hesap silme özelliği yakında eklenecek')
                  }
                }}
              >
                Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
