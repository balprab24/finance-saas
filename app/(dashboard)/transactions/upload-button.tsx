'use client';

import { Upload } from 'lucide-react';
import { useCSVReader } from 'react-papaparse';

import { Button } from '@/components/ui/button';

type Props = {
  onUpload: (results: { data: string[][]; errors: unknown[]; meta: object }) => void;
};

export function UploadButton({ onUpload }: Props) {
  const { CSVReader } = useCSVReader();
  return (
    <CSVReader
      onUploadAccepted={(results: unknown) =>
        onUpload(results as { data: string[][]; errors: unknown[]; meta: object })
      }
    >
      {({ getRootProps }: { getRootProps: () => Record<string, unknown> }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] lg:w-auto"
          {...getRootProps()}
        >
          <Upload className="size-3.5 mr-2" />
          Import CSV
        </Button>
      )}
    </CSVReader>
  );
}
