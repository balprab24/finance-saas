'use client';

import { Upload } from 'lucide-react';
import { useCSVReader } from 'react-papaparse';

import { Button } from '@/components/ui/button';

type Props = { onUpload: (results: { data: string[][]; errors: unknown[]; meta: object }) => void };

export function UploadButton({ onUpload }: Props) {
  const { CSVReader } = useCSVReader();
  return (
    <CSVReader onUploadAccepted={(results: unknown) => onUpload(results as { data: string[][]; errors: unknown[]; meta: object })}>
      {({ getRootProps }: { getRootProps: () => Record<string, unknown> }) => (
        <Button size="sm" className="w-full lg:w-auto" {...getRootProps()}>
          <Upload className="size-4 mr-2" />
          Import
        </Button>
      )}
    </CSVReader>
  );
}
