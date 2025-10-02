import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ImageUploadBoxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUploadBox({ value, onChange, className }: ImageUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:3000/api';


  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onChange(data.filePath);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const fullImageUrl = value && !value.startsWith('http') ? `${new URL(API_URL).origin}${value}` : value;

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative group">
          <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
            <img 
              src={fullImageUrl}
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <div
            className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <span className="text-sm text-muted-foreground font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-medium">Click to upload</span>
                <span className="text-xs text-muted-foreground mt-1">or enter image URL below</span>
              </>
            )}
          </div>
           <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste URL here"
            className="mt-2 px-3 py-2 w-full text-sm rounded-md border border-input bg-background"
          />
        </div>
      )}
    </div>
  );
}
