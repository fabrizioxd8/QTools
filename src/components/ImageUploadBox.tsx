import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadBoxProps {
  // value can be a URL (string), a File (when user selected a file) or null/empty
  value: string | File | null;
  onChange: (value: string | File | null) => void;
  className?: string;
}

export function ImageUploadBox({ value, onChange, className }: ImageUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // previewUrl is managed via local state below

  // If value is a File, create an object URL for preview and clean up on change
  // We'll derive preview inside effects below (useRef used to store current preview)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Pass the actual File object back to the parent; API client will append it to FormData
      onChange(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onChange(file);
    }
  };

  // Compute preview URL depending on the incoming value
  // Use a local state for preview so we don't leak object URLs
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    // Clean up previous preview URL
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }

    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setLocalPreview(url);
    } else if (typeof value === 'string' && value) {
      setLocalPreview(value);
    } else {
      setLocalPreview(null);
    }

    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("space-y-3", className)}>
      {localPreview ? (
        <div className="relative group">
          <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden shadow-sm">
            <img
              src={localPreview || ''}
              alt="Tool preview"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div 
            className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-muted/30 to-muted/60 hover:from-muted/50 hover:to-muted/80 transition-all duration-200 cursor-pointer"
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-3" />
            <span className="text-sm text-muted-foreground font-medium">Upload Tool Image</span>
            <span className="text-xs text-muted-foreground/70 mt-1">Click to browse or drag & drop</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or paste URL</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/tool-image.jpg"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}
