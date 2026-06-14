"use client"

import { useState, useRef } from "react"
import { X, Upload, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "react-hot-toast"
import Image from "next/image"

interface FinanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FinanceModal({ isOpen, onClose, onSuccess }: FinanceModalProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [documentUrl, setDocumentUrl] = useState("")
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen sadece resim dosyası yükleyin')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'invoice')

      const response = await fetch('/api/upload-image-cloud', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Yükleme başarısız')
      }

      const data = await response.json()
      setDocumentUrl(data.url)
      toast.success('Fatura resmi yüklendi')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Resim yüklenirken bir hata oluştu')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !title || !date) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          title,
          description,
          category,
          documentUrl,
          date
        })
      })

      if (!res.ok) {
        throw new Error("Kayıt oluşturulamadı")
      }

      toast.success("Kayıt başarıyla oluşturuldu")
      onSuccess()
      
      // Formu temizle
      setAmount("")
      setTitle("")
      setDescription("")
      setCategory("")
      setDocumentUrl("")
      setDate(new Date().toISOString().split('T')[0])
      
    } catch (error) {
      console.error(error)
      toast.error("Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-white">Yeni Finans Kaydı</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex bg-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "INCOME" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Gelir Ekle
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "EXPENSE" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Gider Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Başlık *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder={type === "INCOME" ? "Örn: Satış Geliri" : "Örn: Sunucu Gideri"}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Tutar (₺) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Tarih *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Kategori</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="Örn: Maaş, Reklam, Altyapı"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 min-h-[100px]"
              placeholder="Detaylı açıklama..."
            />
          </div>

          {type === "EXPENSE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Fatura / Belge Resmi</label>
              
              {!documentUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500 hover:bg-neutral-800/50 transition-all"
                >
                  {isUploading ? (
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mb-3" />
                      <p className="text-sm font-medium text-white mb-1">Resim Yüklemek İçin Tıklayın</p>
                      <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Belge Yüklendi</p>
                        <a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-500 hover:underline">
                          Görüntüle
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentUrl("")}
                      className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
