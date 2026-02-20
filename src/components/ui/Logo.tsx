import Image from "next/image"
import Link from "next/link"

interface LogoProps {
    className?: string
    size?: "sm" | "md" | "lg" | "xl"
    withText?: boolean
    textClassName?: string
}

export default function Logo({ className = "", size = "md", withText = true, textClassName = "" }: LogoProps) {
    const sizeMap = {
        sm: { img: 24, text: "text-lg" },
        md: { img: 32, text: "text-2xl" }, // Default header size
        lg: { img: 48, text: "text-3xl" },
        xl: { img: 64, text: "text-4xl" }
    }

    const { img: imgSize, text: defaultTextSize } = sizeMap[size]

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="relative" style={{ width: imgSize, height: imgSize }}>
                <Image
                    src="/logo.jpeg"
                    alt="Culinora Logo"
                    fill
                    className="object-contain rounded-full"
                />
            </div>
            {withText && (
                <span className={`font-bold ${defaultTextSize} ${textClassName}`}>
                    <span className="text-orange-500">ulin</span>
                    <span className="text-white">ora</span>
                </span>
            )}
        </div>
    )
}
