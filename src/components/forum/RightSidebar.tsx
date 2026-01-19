interface RightSidebarProps {
    // Gelecekte prop eklenebilir
}

export default function RightSidebar({ }: RightSidebarProps) {
    return (
        <div className="hidden lg:flex flex-col w-[300px] flex-shrink-0 h-[calc(100vh-80px)] sticky top-24 space-y-4">

            {/* About Community Widget */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
                <div className="h-10 bg-gradient-to-r from-orange-600 to-orange-400"></div>
                <div className="p-4">
                    <h2 className="text-base font-bold text-white mb-2 flex items-center">
                        Chef Sosyal Topluluğu
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Profesyonel şefler ve gastronomi tutkunlarının buluşma noktası. Tariflerinizi paylaşın, sorular sorun ve network kurun.
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-800">
                        <div>
                            <div className="font-bold text-white">1.2k</div>
                            <div>Üye</div>
                        </div>
                        <div>
                            <div className="font-bold text-white">150</div>
                            <div>Çevrimiçi</div>
                        </div>
                    </div>

                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-full transition-colors">
                        Konu Oluştur
                    </button>
                </div>
            </div>

            {/* Rules Widget */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-bold text-white mb-3">Topluluk Kuralları</h3>
                <ul className="space-y-2 text-xs text-gray-400">
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-gray-500">1.</span>
                        Saygılı ve yapıcı olun.
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-gray-500">2.</span>
                        Spam ve reklam yasaktır.
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-gray-500">3.</span>
                        Telif haklarına saygı gösterin.
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-gray-500">4.</span>
                        Konu başlıklarını doğru seçin.
                    </li>
                </ul>
            </div>

        </div>
    )
}
