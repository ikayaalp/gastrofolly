'use client'

import Link from 'next/link'

interface HashtagTextProps {
    text: string
    className?: string
}

export default function HashtagText({ text, className = "" }: HashtagTextProps) {
    if (!text) return null;

    // Hashtag ve Mentionları bulmak için regex
    const parts = text.split(/(#[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+|@[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_]+)/g);

    return (
        <div className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
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
                if (part.startsWith('@')) {
                    return (
                        <span key={i} className="text-orange-500 font-bold hover:underline cursor-pointer">
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
}
