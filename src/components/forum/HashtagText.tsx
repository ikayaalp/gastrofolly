'use client'

import Link from 'next/link'

interface HashtagTextProps {
    text: string
    className?: string
}

export default function HashtagText({ text, className = "" }: HashtagTextProps) {
    if (!text) return null;

    // Hashtagleri bulmak için regex: # harfi ile başlayan ve boşluk/noktalama işaretine kadar devam eden kelimeler
    // Not: Türkçe karakter desteği için \w yerine daha geniş bir kapsam kullanıyoruz
    const parts = text.split(/(#[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g);

    return (
        <div className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    const tag = part.slice(1);
                    return (
                        <Link
                            key={i}
                            href={`/chef-sosyal?search=${encodeURIComponent(part)}`}
                            className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
}
