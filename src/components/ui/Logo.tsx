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
        sm: { img: 24, text: "text-lg", margin: 0 },
        md: { img: 32, text: "text-2xl", margin: 0 }, // Default header size
        lg: { img: 48, text: "text-3xl", margin: -1 },
        xl: { img: 64, text: "text-4xl", margin: -2 }
    }

    const { img: imgSize, text: defaultTextSize, margin: marginLeft } = sizeMap[size]

    return (
        <div className={`flex items-center ${className}`}>
            <div className="relative" style={{ width: imgSize, height: imgSize }}>
                <Image
                    src="/logo.png"
                    alt="Culinora Logo"
                    fill
                    className="object-contain"
                />
            </div>
            {withText && (
                <span className={`font-bold ${defaultTextSize} ${textClassName}`} style={{ marginLeft }}>
                    <span className="text-orange-500">ulin</span>
                    <span className="text-white">ora</span>
                </span>
            )}
        </div>
    )
}
