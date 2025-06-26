
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { SignaturePad } from './signature-pad';
import { toast } from 'sonner';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SignatureFieldData {
  id: string;
  type: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX';
  label?: string;
  pageNumber: number;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  required: boolean;
  signerId?: string;
  value?: string;
  isSigned?: boolean;
}

interface PDFViewerProps {
  fileUrl: string;
  signatureFields?: SignatureFieldData[];
  isEditable?: boolean;
  isSigningMode?: boolean;
  currentSignerId?: string;
  onFieldAdd?: (field: Omit<SignatureFieldData, 'id'>) => void;
  onFieldUpdate?: (fieldId: string, value: string, signatureType?: string) => void;
  onFieldRemove?: (fieldId: string) => void;
  className?: string;
}

export function PDFViewer({
  fileUrl,
  signatureFields = [],
  isEditable = false,
  isSigningMode = false,
  currentSignerId,
  onFieldAdd,
  onFieldUpdate,
  onFieldRemove,
  className = ''
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [currentField, setCurrentField] = useState<SignatureFieldData | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(800);
  const [pageWidth, setPageWidth] = useState<number>(600);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setCurrentPage(1);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageHeight(viewport.height);
    setPageWidth(viewport.width);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDrop = useCallback((e: React.DragEvent, pageNumber: number) => {
    e.preventDefault();
    setIsDragging(false);

    if (!draggedFieldType || !isEditable || !onFieldAdd) return;

    const pageElement = pageRefs.current[pageNumber - 1];
    if (!pageElement) return;

    const rect = pageElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newField: Omit<SignatureFieldData, 'id'> = {
      type: draggedFieldType as any,
      pageNumber,
      x: Math.max(0, Math.min(x - 5, 90)), // Center and constrain
      y: Math.max(0, Math.min(y - 2, 95)),
      width: draggedFieldType === 'SIGNATURE' ? 20 : draggedFieldType === 'DATE' ? 15 : 10,
      height: draggedFieldType === 'SIGNATURE' ? 8 : 5,
      required: true,
      label: draggedFieldType === 'SIGNATURE' ? 'Signature' : 
             draggedFieldType === 'INITIALS' ? 'Initials' :
             draggedFieldType === 'DATE' ? 'Date' : 
             draggedFieldType === 'TEXT' ? 'Text Field' : 'Checkbox'
    };

    onFieldAdd(newField);
    setDraggedFieldType(null);
    toast.success(`${newField.label} field added`);
  }, [draggedFieldType, isEditable, onFieldAdd]);

  const handleFieldClick = (field: SignatureFieldData) => {
    if (isSigningMode) {
      // In signing mode, open signature pad for current signer's fields
      if (field.signerId === currentSignerId || !field.signerId) {
        setCurrentField(field);
        if (field.type === 'SIGNATURE' || field.type === 'INITIALS') {
          setShowSignaturePad(true);
        } else if (field.type === 'DATE') {
          const currentDate = new Date().toLocaleDateString();
          onFieldUpdate?.(field.id, currentDate);
          toast.success('Date field filled');
        } else if (field.type === 'TEXT') {
          const value = prompt('Enter text:');
          if (value) {
            onFieldUpdate?.(field.id, value);
            toast.success('Text field filled');
          }
        } else if (field.type === 'CHECKBOX') {
          onFieldUpdate?.(field.id, field.value === 'checked' ? '' : 'checked');
          toast.success('Checkbox toggled');
        }
      } else {
        toast.error('This field is assigned to another signer');
      }
    }
  };

  const handleSignatureSave = (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => {
    if (currentField && onFieldUpdate) {
      onFieldUpdate(currentField.id, signatureData, signatureType);
      setShowSignaturePad(false);
      setCurrentField(null);
      toast.success('Signature added successfully');
    }
  };

  const renderSignatureField = (field: SignatureFieldData, pageNumber: number) => {
    const isCurrentSignerField = !field.signerId || field.signerId === currentSignerId;
    const canInteract = isSigningMode ? isCurrentSignerField : isEditable;
    
    return (
      <div
        key={field.id}
        className={`absolute border-2 border-dashed cursor-pointer transition-all duration-200 ${
          field.isSigned 
            ? 'border-green-500 bg-green-50' 
            : canInteract 
              ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' 
              : 'border-gray-400 bg-gray-50'
        } ${canInteract ? 'hover:border-solid' : ''}`}
        style={{
          left: `${field.x}%`,
          top: `${field.y}%`,
          width: `${field.width}%`,
          height: `${field.height}%`,
          zIndex: 10
        }}
        onClick={() => handleFieldClick(field)}
        onContextMenu={(e) => {
          if (isEditable && onFieldRemove) {
            e.preventDefault();
            onFieldRemove(field.id);
            toast.success('Field removed');
          }
        }}
      >
        <div className="flex items-center justify-center h-full text-xs font-medium">
          {field.value ? (
            field.type === 'SIGNATURE' || field.type === 'INITIALS' ? (
              <img 
                src={field.value} 
                alt="Signature" 
                className="max-w-full max-h-full object-contain"
              />
            ) : field.type === 'CHECKBOX' ? (
              <div className={`w-4 h-4 border border-gray-400 ${field.value === 'checked' ? 'bg-blue-500' : 'bg-white'}`}>
                {field.value === 'checked' && <span className="text-white text-xs">✓</span>}
              </div>
            ) : (
              <span className="truncate px-1">{field.value}</span>
            )
          ) : (
            <span className="text-gray-600">
              {field.type === 'SIGNATURE' ? 'Sign' : 
               field.type === 'INITIALS' ? 'Init' :
               field.type === 'DATE' ? 'Date' :
               field.type === 'TEXT' ? 'Text' : '☐'}
            </span>
          )}
        </div>
        
        {field.required && !field.isSigned && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 text-xs px-1 py-0"
          >
            *
          </Badge>
        )}
      </div>
    );
  };

  const renderFieldToolbox = () => {
    if (!isEditable) return null;

    const fieldTypes = [
      { type: 'SIGNATURE', label: 'Signature', icon: '✍️' },
      { type: 'INITIALS', label: 'Initials', icon: '🔤' },
      { type: 'DATE', label: 'Date', icon: '📅' },
      { type: 'TEXT', label: 'Text', icon: '📝' },
      { type: 'CHECKBOX', label: 'Checkbox', icon: '☐' }
    ];

    return (
      <Card className="p-4 mb-4">
        <h3 className="text-sm font-medium mb-3">Drag fields to document:</h3>
        <div className="flex flex-wrap gap-2">
          {fieldTypes.map((fieldType) => (
            <Button
              key={fieldType.type}
              variant="outline"
              size="sm"
              className="cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => {
                setDraggedFieldType(fieldType.type);
                setIsDragging(true);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => {
                setIsDragging(false);
                setDraggedFieldType(null);
              }}
            >
              <span className="mr-2">{fieldType.icon}</span>
              {fieldType.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Right-click on a field to remove it
        </p>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {renderFieldToolbox()}
      
      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* PDF Document */}
      <div 
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-auto bg-gray-100 max-h-[70vh]"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('PDF load error:', error);
            toast.error('Failed to load PDF document');
          }}
          className="flex flex-col items-center p-4 space-y-4"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div
              key={`page_${index + 1}`}
              ref={el => pageRefs.current[index] = el}
              className="relative bg-white shadow-lg"
              onDrop={(e) => handleDrop(e, index + 1)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              style={{
                opacity: currentPage === index + 1 ? 1 : 0.3,
                display: currentPage === index + 1 ? 'block' : 'none'
              }}
            >
              <Page
                pageNumber={index + 1}
                scale={scale}
                rotate={rotation}
                onLoadSuccess={onPageLoadSuccess}
                className="relative"
              />
              
              {/* Render signature fields for current page */}
              {signatureFields
                .filter(field => field.pageNumber === index + 1)
                .map(field => renderSignatureField(field, index + 1))}
              
              {/* Drop overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 flex items-center justify-center">
                  <p className="text-blue-600 font-medium">Drop field here</p>
                </div>
              )}
            </div>
          ))}
        </Document>
      </div>

      {/* Signature Pad Modal */}
      <SignaturePad
        isOpen={showSignaturePad}
        onClose={() => {
          setShowSignaturePad(false);
          setCurrentField(null);
        }}
        onSave={handleSignatureSave}
        fieldLabel={currentField?.label || 'Signature'}
      />
    </div>
  );
}
