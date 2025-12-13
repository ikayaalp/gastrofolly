"use client"

import { useState } from "react"
import { Menu, X, Bell } from "lucide-react"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm">
                    <div className="absolute left-0 top-0 bottom-0">
                        <AdminSidebar onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-4 right-4 text-white p-2"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full">
                {/* Top Header */}
                <header className="h-16 border-b border-gray-800 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center">
                        <button
                            className="md:hidden mr-4 text-gray-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h2 className="text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full text-xs font-mono border border-gray-800 hidden md:block">
                            v2.0.0
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold border-2 border-orange-400/20">
                            AD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
