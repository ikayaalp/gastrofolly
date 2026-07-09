'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    isLoading = false
}: ModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const sizeStyles = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl"
    };

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Panel */}
            <div 
                className={`
                    relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full shadow-2xl transform transition-all duration-300 
                    ${sizeStyles[size]} 
                    ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <h3 className="text-xl font-bold text-white mb-4 pr-8">{title}</h3>
                )}
                
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative">
                    {children}
                </div>

                {footer && (
                    <div className="flex items-center justify-end gap-3 mt-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
