import { extname } from 'path';

export interface ImageValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
    // Check if file exists
    if (!file) {
        return { isValid: false, error: "No file provided" };
    }

    // Validate file type
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
        return { 
            isValid: false, 
            error: "Invalid file type. Please upload a valid image file (.jpg, .jpeg, .png, .webp)" 
        };
    }

    // Validate file extension (additional check)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = extname(file.name.toLowerCase());
    
    if (!allowedExtensions.includes(fileExtension)) {
        return { 
            isValid: false, 
            error: "Invalid file extension. Please upload a valid image file (.jpg, .jpeg, .png, .webp)" 
        };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return { 
            isValid: false, 
            error: "Image file size must be less than 5MB" 
        };
    }

    // Additional checks for minimum size (to avoid empty files)
    if (file.size < 100) { // 100 bytes minimum
        return { 
            isValid: false, 
            error: "Image file appears to be empty or corrupted" 
        };
    }

    return { isValid: true };
}

export function generateUniqueFilename(userId: number, originalExtension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${timestamp}_${random}.${originalExtension}`;
}

export function getFileExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };
    
    return mimeToExt[mimeType] || 'jpg';
}