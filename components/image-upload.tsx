"use client";

import { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  preview?: string;
  className?: string;
}

export function ImageUpload({ onImageSelect, preview: initialPreview, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    onImageSelect(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("w-full", className)}>
      {!preview ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragging ? "border-[#3b82f6] bg-[#3b82f6]/5" : "border-[#2e3548] hover:border-[#3b82f6]/50 bg-[#1e2433]"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-10 h-10 text-slate-500 mb-4" />
          <p className="text-sm font-medium text-slate-300">Drag & drop or click to upload</p>
          <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-[#2e3548] bg-[#1e2433] group">
          <img src={preview} alt="Upload preview" className="w-full h-auto object-cover max-h-64" />
          <button 
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
