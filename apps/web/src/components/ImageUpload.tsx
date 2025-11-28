import React, { useState, useRef } from 'react';
import { apiClient } from '../lib/apiClient';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onError: (error: string) => void;
  currentImage?: string;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onError,
  currentImage,
  label = 'Upload Image',
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side size check (500KB)
    if (file.size > 500 * 1024) {
      onError('File size exceeds 500KB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side type check
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    onError(''); // Clear previous errors

    try {
      const url = await apiClient.uploadImage(file);
      onUploadComplete(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image.';
      onError(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center space-x-4">
        {currentImage && (
          <div className="relative w-24 h-24 border rounded overflow-hidden bg-gray-100">
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={label}
          />
          <p className="mt-1 text-xs text-gray-500">
            Max 500KB. JPEG, PNG, WebP.
          </p>
        </div>
      </div>
      
      {uploading && (
        <div className="text-sm text-blue-600" role="status">
          Uploading...
        </div>
      )}
    </div>
  );
};
