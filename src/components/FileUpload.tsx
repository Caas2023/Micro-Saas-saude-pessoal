import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, X, Loader2, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isProcessing
  });
  
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  const clearFile = () => {
    setPreview(null);
  };

  return (
    <Card className={cn(
      "relative border-2 border-dashed transition-all duration-300 glass hover-glow",
      isDragActive ? "border-primary bg-primary/5" : "border-white/10"
    )}>
      {!preview ? (
        <div {...getRootProps()} className="p-12 cursor-pointer text-center">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-white/5 border border-white/10">
              <UploadIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium">Arraste seu exame aqui</p>
              <p className="text-sm text-muted-foreground">Suporte para JPG, PNG e PDF</p>
            </div>
            <input 
              type="file" 
              ref={cameraInputRef} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleCameraCapture}
            />
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button variant="secondary" disabled={isProcessing} className="w-full sm:w-auto h-12 rounded-xl">
                Selecionar Arquivo
              </Button>
              <Button 
                onClick={triggerCamera} 
                variant="default" 
                disabled={isProcessing} 
                className="w-full sm:w-auto sm:hidden h-12 rounded-xl gap-2 shadow-lg shadow-primary/20"
              >
                <Camera className="w-5 h-5" />
                Tirar Foto
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black/20">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium animate-pulse">IA está analisando seus dados...</p>
              </div>
            )}
            <img src={preview} alt="Preview do Exame" className="w-full h-full object-contain" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full h-8 w-8"
              onClick={clearFile}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-white/5 border border-white/10">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm truncate font-medium">Arquivo selecionado para processamento</span>
          </div>
        </div>
      )}
    </Card>
  );
};
