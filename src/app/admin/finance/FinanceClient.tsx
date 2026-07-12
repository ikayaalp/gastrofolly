"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar, Trash2, FileImage, Search, Pencil } from "lucide-react"
import FinanceModal from "@/components/admin/FinanceModal"
import { toast } from "react-hot-toast"

interface FinanceRecord {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  title: string
  description?: string
  category?: string
  documentUrl?: string
  date: string
  createdAt: string
  createdBy?: {
    name: string | null
    email: string
  }
}

interface YearlySummaryItem {
  month: number
  income: number
  expense: number
}

const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function FinanceClient() {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly")

  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [yearlySummary, setYearlySummary] = useState<YearlySummaryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString())

  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (viewMode === "monthly") {
        const res = await fetch(`/api/admin/finance?month=${selectedMonth}`)
        if (!res.ok) throw new Error("Aylık veriler alınamadı")
        const data = await res.json()
        setRecords(data)
      } else {
        const res = await fetch(`/api/admin/finance?year=${selectedYear}`)
        if (!res.ok) throw new Error("Yıllık veriler alınamadı")
        const data = await res.json()
        setYearlySummary(data)
      }
    } catch (error) {
      console.error(error)
      toast.error("Finans kayıtları yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [viewMode, selectedMonth, selectedYear])

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return

    try {
      const res = await fetch(`/api/admin/finance?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Kayıt silinemedi")

      toast.success("Kayıt başarıyla silindi")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Silme işlemi başarısız oldu")
    }
  }

  const handleEdit = (record: FinanceRecord) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  // Hesaplamalar
  const totalIncome = useMemo(() => {
    if (viewMode === "monthly") {
      return records.filter(r => r.type === "INCOME").reduce((acc, r) => acc + r.amount, 0)
    }
    return yearlySummary.reduce((acc, curr) => acc + curr.income, 0)
  }, [records, yearlySummary, viewMode])

  const totalExpense = useMemo(() => {
    if (viewMode === "monthly") {
      return records.filter(r => r.type === "EXPENSE").reduce((acc, r) => acc + r.amount, 0)
    }
    return yearlySummary.reduce((acc, curr) => acc + curr.expense, 0)
  }, [records, yearlySummary, viewMode])

  const netProfit = totalIncome - totalExpense

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.category && record.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gelir & Gider Yönetimi</h1>
          <p className="text-gray-400 mt-1 text-sm">Finansal durumunuzu ve faturalarınızı takip edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Görünüm Toggle */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "monthly" ? "bg-neutral-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setViewMode("yearly")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "yearly" ? "bg-neutral-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Yıllık
            </button>
          </div>

          {/* Tarih Seçiciler */}
          <div className="flex items-center space-x-2">
            {viewMode === "monthly" ? (
              <>
                <select
                  value={selectedMonth.split('-')[1]}
                  onChange={(e) => setSelectedMonth(`${selectedMonth.split('-')[0]}-${e.target.value}`)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 cursor-pointer appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="01">Ocak</option>
                  <option value="02">Şubat</option>
                  <option value="03">Mart</option>
                  <option value="04">Nisan</option>
                  <option value="05">Mayıs</option>
                  <option value="06">Haziran</option>
                  <option value="07">Temmuz</option>
                  <option value="08">Ağustos</option>
                  <option value="09">Eylül</option>
                  <option value="10">Ekim</option>
                  <option value="11">Kasım</option>
                  <option value="12">Aralık</option>
                </select>
                <select
                  value={selectedMonth.split('-')[0]}
                  onChange={(e) => setSelectedMonth(`${e.target.value}-${selectedMonth.split('-')[1]}`)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 cursor-pointer appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 cursor-pointer appearance-none"
                style={{ backgroundImage: 'none' }}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center transition-colors shadow-lg shadow-orange-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kayıt Ekle
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">
                {viewMode === 'monthly' ? 'Aylık Toplam Gelir' : 'Yıllık Toplam Gelir'}
              </p>
              <h3 className="text-2xl font-bold text-white">₺{totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">
                {viewMode === 'monthly' ? 'Aylık Toplam Gider' : 'Yıllık Toplam Gider'}
              </p>
              <h3 className="text-2xl font-bold text-white">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">
                {viewMode === 'monthly' ? 'Aylık Net Kar / Zarar' : 'Yıllık Net Kar / Zarar'}
              </p>
              <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netProfit >= 0 ? '+' : ''}₺{netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tablo İçeriği (Görünüme Göre) */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl overflow-hidden">
        {viewMode === "yearly" ? (
          <>
            <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-white">{selectedYear} Yılı Özeti</h3>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                  <p>Yükleniyor...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/50 border-b border-neutral-800 text-xs uppercase text-gray-500">
                      <th className="py-4 px-6 font-medium">Ay</th>
                      <th className="py-4 px-6 font-medium text-right">Gelir</th>
                      <th className="py-4 px-6 font-medium text-right">Gider</th>
                      <th className="py-4 px-6 font-medium text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {yearlySummary.map((item) => {
                      const itemNet = item.income - item.expense;
                      return (
                        <tr key={item.month} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-white">{TURKISH_MONTHS[item.month - 1]}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-sm font-medium text-green-500">
                              ₺{item.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-sm font-medium text-red-500">
                              ₺{item.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`text-sm font-bold ${itemNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {itemNet >= 0 ? '+' : ''}₺{itemNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-white">İşlem Geçmişi</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Başlık veya kategori ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                  <p>Yükleniyor...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <Calendar className="w-12 h-12 mb-3 text-neutral-700" />
                  <p>Bu aya ait kayıt bulunamadı.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/50 border-b border-neutral-800 text-xs uppercase text-gray-500">
                      <th className="py-4 px-6 font-medium">İşlem</th>
                      <th className="py-4 px-6 font-medium">Tarih</th>
                      <th className="py-4 px-6 font-medium">Ekleyen</th>
                      <th className="py-4 px-6 font-medium">Kategori</th>
                      <th className="py-4 px-6 font-medium text-right">Tutar</th>
                      <th className="py-4 px-6 font-medium text-center">Belge</th>
                      <th className="py-4 px-6 font-medium text-right">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-3 ${record.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="text-sm font-medium text-white">{record.title}</p>
                              {record.description && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{record.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {new Date(record.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {record.createdBy?.name || record.createdBy?.email || '-'}
                        </td>
                        <td className="py-4 px-6">
                          {record.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-800 text-gray-300">
                              {record.category}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`text-sm font-medium ${record.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                            {record.type === 'INCOME' ? '+' : '-'}₺{record.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {record.documentUrl ? (
                            <a
                              href={record.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                              title="Faturayı Görüntüle"
                            >
                              <FileImage className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-gray-500 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <FinanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
        }}
        onSuccess={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
          fetchData()
        }}
        editingRecord={editingRecord}
      />
    </div>
  )
}
