"use client";

import { useRef, useState, type DragEvent } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  onFiles,
  loading,
}: {
  onFiles: (files: FileList | File[]) => void;
  loading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
        over ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
      )}
      <p className="text-xs text-muted-foreground">Drop data here</p>
      <Button
        size="sm"
        variant="secondary"
        className="h-7"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </Button>
      <p className="text-[10px] text-muted-foreground/80">
        GeoJSON · KML · zipped Shapefile
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".geojson,.json,.kml,.zip"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
