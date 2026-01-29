
'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    isDanger = false,
    isLoading = false
}: ConfirmationModalProps) {
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

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className={`
                relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 
                w-full max-w-md shadow-2xl transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                            {message}
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`
                                    px-6 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isDanger
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/20'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>İşleniyor...</span>
                                    </div>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
