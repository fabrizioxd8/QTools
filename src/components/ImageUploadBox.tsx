import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadBoxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUploadBox({ value, onChange, className }: ImageUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a local URL for the file
      const fileUrl = URL.createObjectURL(file);
      onChange(fileUrl);
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
      const fileUrl = URL.createObjectURL(file);
      onChange(fileUrl);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {value ? (
        <div className="relative group">
          <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden shadow-sm">
            <img 
              src={value}
              alt="Tool preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
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
              value={value}
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
