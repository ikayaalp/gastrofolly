import Link from "next/link"
import { ChefHat, Home, Search } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-orange-600/20 p-6 rounded-full mb-6 animate-pulse">
                <ChefHat className="h-16 w-16 text-orange-500" />
            </div>

            <h1 className="text-6xl font-bold text-white mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-white mb-4">
                Oops! Aradığınız tarif bulunamadı.
            </h2>

            <p className="text-gray-400 max-w-md mb-8">
                Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak servis dışı olabilir.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/home"
                    className="flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Home className="mr-2 h-5 w-5" />
                    Ana Sayfaya Dön
                </Link>

                <Link
                    href="/courses"
                    className="flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Search className="mr-2 h-5 w-5" />
                    Kurslara Göz At
                </Link>
            </div>

            <div className="absolute bottom-8 text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Culinora. Tüm hakları saklıdır.
            </div>
        </div>
    )
}
