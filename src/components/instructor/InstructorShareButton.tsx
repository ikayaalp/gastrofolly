"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"

interface InstructorShareButtonProps {
  instructorId: string
  instructorName: string
}

export default function InstructorShareButton({ instructorId, instructorName }: InstructorShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const instructorUrl = `${window.location.origin}/instructor/${instructorId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(instructorUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black text-white py-3 px-4 rounded-lg hover:text-orange-500 transition-colors flex items-center justify-center space-x-2 font-semibold border border-gray-700"
      >
        <Share2 className="h-5 w-5" />
        <span>Profili Paylaş</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Share Modal */}
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <h3 className="text-white font-semibold mb-4">Eğitmen Profilini Paylaş</h3>

              {/* Copy Link */}
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={instructorUrl}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${copied
                        ? 'bg-green-600 text-white'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 inline" />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1 inline" />
                        Kopyala
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
