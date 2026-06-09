'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Spinner } from './ui/misc';

export function UploadButton({
  accept,
  onFile,
  loading,
  label = 'Unggah File',
}: {
  accept: string;
  onFile: (file: File) => void;
  loading?: boolean;
  label?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <Button disabled={loading} onClick={() => ref.current?.click()}>
        {loading ? <Spinner /> : <Upload className="h-4 w-4" />} {label}
      </Button>
    </>
  );
}
