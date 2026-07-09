'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({
    label,
    error,
    className = '',
    ...props
}: InputProps) {
    const errorStyles = error ? "border-red-500" : "border-zinc-800";
    const inputStyles = `w-full bg-zinc-950 border rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors ${errorStyles} ${className}`;

    return (
        <div className="w-full">
            {label && (
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    {label}
                </label>
            )}
            <input className={inputStyles} {...props} />
            {error && (
                <p className="text-sm text-red-500 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
