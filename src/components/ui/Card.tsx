'use client';

import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export default function Card({
    children,
    className = '',
    hover = false
}: CardProps) {
    const baseStyles = "bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden";
    const hoverStyles = hover ? "hover:border-orange-500/50 transition-all duration-300" : "";

    return (
        <div className={`${baseStyles} ${hoverStyles} ${className}`}>
            {children}
        </div>
    );
}
