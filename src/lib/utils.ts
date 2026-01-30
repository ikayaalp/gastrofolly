import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

export function getOptimizedMediaUrl(url: string | null | undefined, type: 'IMAGE' | 'VIDEO' = 'IMAGE') {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Check if it already has transformations (avoid duplicate insertion)
    if (url.includes('/q_auto,f_auto')) return url;

    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    let transformation = 'q_auto,f_auto';
    if (type === 'VIDEO') {
        transformation += ',c_limit,w_1280,h_720';
    }

    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
}
