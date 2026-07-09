'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";
    
    const variantStyles = {
        primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20",
        secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
        ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white"
    };

    const sizeStyles = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}
