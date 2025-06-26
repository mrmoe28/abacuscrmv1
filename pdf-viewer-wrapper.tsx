
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import with SSR disabled for better performance
const EnhancedPDFViewer = dynamic(
  () => import('./enhanced-pdf-viewer').then(mod => ({ default: mod.EnhancedPDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-4">
          <Skeleton className="w-64 h-96" />
          <Skeleton className="flex-1 h-96" />
        </div>
      </div>
    ),
  }
);

// Re-export the component props interface
export interface PDFViewerWrapperProps {
  fileUrl: string;
  signatureFields?: Array<{
    id: string;
    type: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX';
    label?: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    signerId?: string;
    value?: string;
    isSigned?: boolean;
  }>;
  isEditable?: boolean;
  isSigningMode?: boolean;
  currentSignerId?: string;
  onFieldAdd?: (field: any) => void;
  onFieldUpdate?: (fieldId: string, value: string, signatureType?: string) => void;
  onFieldRemove?: (fieldId: string) => void;
  className?: string;
  showThumbnails?: boolean;
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableDownload?: boolean;
  enablePrint?: boolean;
}

export function PDFViewerWrapper(props: PDFViewerWrapperProps) {
  return <EnhancedPDFViewer {...props} />;
}

// Keep the original PDFViewer export for backward compatibility
export { EnhancedPDFViewer as PDFViewer };
