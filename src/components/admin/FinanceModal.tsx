"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, CheckCircle2 } from "lucide-react"
import { toast } from "react-hot-toast"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

interface FinanceRecord {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  title: string
  description?: string
  category?: string
  documentUrl?: string
  date: string
}

interface FinanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingRecord?: FinanceRecord | null
}

export default function FinanceModal({ isOpen, onClose, onSuccess, editingRecord }: FinanceModalProps) {
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

  const isEditing = !!editingRecord

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setType(editingRecord.type)
        setAmount(editingRecord.amount.toString())
        setTitle(editingRecord.title)
        setDescription(editingRecord.description || "")
        setCategory(editingRecord.category || "")
        setDate(new Date(editingRecord.date).toISOString().split('T')[0])
        setDocumentUrl(editingRecord.documentUrl || "")
      } else {
        setType("INCOME")
        setAmount("")
        setTitle("")
        setDescription("")
        setCategory("")
        setDate(new Date().toISOString().split('T')[0])
        setDocumentUrl("")
      }
    }
  }, [isOpen, editingRecord])

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
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingRecord.id } : {}),
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
        throw new Error(isEditing ? "Kayıt güncellenemedi" : "Kayıt oluşturulamadı")
      }

      toast.success(isEditing ? "Kayıt başarıyla güncellendi" : "Kayıt başarıyla oluşturuldu")
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Kaydı Düzenle" : "Yeni Finans Kaydı"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 flex flex-col">
        <div className="flex bg-zinc-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === "INCOME" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Gelir Ekle
          </button>
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === "EXPENSE" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Gider Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Başlık *"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "INCOME" ? "Örn: Satış Geliri" : "Örn: Sunucu Gideri"}
            required
          />

          <Input
            label="Tutar (₺) *"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <Input
            label="Tarih *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Kategori"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Örn: Maaş, Reklam, Altyapı"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 block mb-1.5">Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 min-h-[100px]"
            placeholder="Detaylı açıklama..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 block mb-1.5">Dekont / Fatura / Belge Resmi</label>
          
          {!documentUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500 hover:bg-zinc-800/50 transition-all"
              >
                {isUploading ? (
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-500 mb-3" />
                    <p className="text-sm font-medium text-white mb-1">Resim Yüklemek İçin Tıklayın</p>
                    <p className="text-xs text-zinc-500">JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
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

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-800/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              İptal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || isUploading}
            >
              Kaydet
            </Button>
          </div>
      </form>
    </Modal>
  )
}

