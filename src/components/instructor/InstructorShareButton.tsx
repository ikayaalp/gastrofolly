"use client"

import { useState } from "react"
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail } from "lucide-react"

interface InstructorShareButtonProps {
  instructorId: string
  instructorName: string
}

export default function InstructorShareButton({ instructorId, instructorName }: InstructorShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const instructorUrl = `${window.location.origin}/instructor/${instructorId}`
  const shareText = `${instructorName} eğitmeninin profilini Chef2.0'da keşfet!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(instructorUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(instructorUrl)
    const encodedText = encodeURIComponent(shareText)

    let shareUrl = ''

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'mail':
        shareUrl = `mailto:?subject=${encodeURIComponent(instructorName + ' - Eğitmen Profili')}&body=${encodedText}%0A%0A${encodedUrl}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 font-semibold"
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
              <div className="mb-4">
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

              {/* Social Share Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </button>

                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="flex items-center justify-center p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </button>

                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="flex items-center justify-center p-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </button>

                <button
                  onClick={() => handleSocialShare('mail')}
                  className="flex items-center justify-center p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  E-posta
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
