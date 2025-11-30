"use client"

import Link from "next/link"
import { Crown, Sparkles, ArrowRight, BookOpen, Zap } from "lucide-react"

export default function SubscriptionBanner() {
    const plans = [
        {
            name: "Commis",
            price: "199",
            icon: BookOpen,
            color: "from-gray-600 to-gray-700",
            borderColor: "border-gray-500/50",
        },
        {
            name: "D partie",
            price: "399",
            icon: Crown,
            color: "from-orange-600 to-red-600",
            borderColor: "border-orange-500/50",
            popular: true,
        },
        {
            name: "Executive",
            price: "599",
            icon: Zap,
            color: "from-purple-600 to-pink-600",
            borderColor: "border-purple-500/50",
        }
    ]

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20 border border-orange-500/20 rounded-2xl p-8 md:p-12 my-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>

            {/* Animated Sparkles */}
            <div className="absolute top-4 right-4 animate-pulse">
                <Sparkles className="h-6 w-6 text-orange-400" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Tüm Kurslara
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
                            Sınırsız Erişim!
                        </span>
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Size en uygun paketi seçin ve gastronomi dünyasında ustalaşın
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon
                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-black/40 backdrop-blur-sm border-2 ${plan.borderColor} rounded-xl p-6 transition-all duration-300 hover:scale-105 ${plan.popular ? 'md:scale-105 shadow-xl shadow-orange-500/20' : ''}`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            EN POPÜLER
                                        </div>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className="flex justify-center mb-4">
                                    <div className={`bg-gradient-to-br ${plan.color} rounded-full p-3`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-xl font-bold text-white text-center mb-2">{plan.name}</h3>

                                {/* Price */}
                                <div className="text-center mb-4">
                                    <div className="text-4xl font-bold text-white">
                                        {plan.price}₺
                                    </div>
                                    <p className="text-gray-400 text-sm">/ Aylık</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/subscription"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
                    >
                        Tüm Paketleri İncele
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
