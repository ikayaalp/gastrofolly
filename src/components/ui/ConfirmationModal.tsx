'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

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
    showCancelButton?: boolean;
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
    isLoading = false,
    showCancelButton = true
}: ConfirmationModalProps) {
    const footer = (
        <>
            {showCancelButton && (
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>
            )}
            <Button
                onClick={onConfirm}
                isLoading={isLoading}
                variant={isDanger ? 'danger' : 'primary'}
            >
                {isLoading ? 'İşleniyor...' : confirmText}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            isLoading={isLoading}
            size="md"
            footer={footer}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
