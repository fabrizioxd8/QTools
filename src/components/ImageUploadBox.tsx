import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadBoxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUploadBox({ value, onChange, className }: ImageUploadBoxProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative group">
          <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
            <img 
              src={value}
              alt="Preview" 
              className="w-full h-full object-cover"
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
        <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground font-medium">Tap to upload</span>
          <span className="text-xs text-muted-foreground mt-1">Enter image URL</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste URL here"
            className="mt-4 px-3 py-2 w-4/5 text-sm rounded-md border border-input bg-background"
            onClick={(e) => e.stopPropagation()}
          />
        </label>
      )}
    </div>
  );
}
