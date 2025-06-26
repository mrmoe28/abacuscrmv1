
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer,
  ChevronLeft, 
  ChevronRight,
  Maximize,
  Minimize,
  Search,
  Menu,
  X,
  FileText,
  Eye,
  EyeOff,
  Expand,
  Move
} from 'lucide-react';
import { SignaturePad } from './signature-pad';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface SearchResult {
  pageNumber: number;
  matches: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface EnhancedPDFViewerProps {
  fileUrl: string;
  signatureFields?: SignatureFieldData[];
  isEditable?: boolean;
  isSigningMode?: boolean;
  currentSignerId?: string;
  onFieldAdd?: (field: Omit<SignatureFieldData, 'id'>) => void;
  onFieldUpdate?: (fieldId: string, value: string, signatureType?: string) => void;
  onFieldRemove?: (fieldId: string) => void;
  className?: string;
  showThumbnails?: boolean;
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableDownload?: boolean;
  enablePrint?: boolean;
}

export function EnhancedPDFViewer({
  fileUrl,
  signatureFields = [],
  isEditable = false,
  isSigningMode = false,
  currentSignerId,
  onFieldAdd,
  onFieldUpdate,
  onFieldRemove,
  className = '',
  showThumbnails = true,
  enableSearch = true,
  enableFullscreen = true,
  enableDownload = true,
  enablePrint = true
}: EnhancedPDFViewerProps) {
  // Core PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageHeight, setPageHeight] = useState<number>(800);
  const [pageWidth, setPageWidth] = useState<number>(600);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnailSidebar, setShowThumbnailSidebar] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Signature state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [currentField, setCurrentField] = useState<SignatureFieldData | null>(null);

  // Touch gestures state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [isGesturing, setIsGesturing] = useState<boolean>(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // PDF loading handlers
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

  // Zoom and navigation handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40; // padding
      const idealScale = containerWidth / pageWidth;
      setScale(Math.min(idealScale, 2));
    }
  }, [pageWidth]);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
    }
  }, [numPages]);

  const handlePrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;

    if (!isFullscreen) {
      if (documentRef.current?.requestFullscreen) {
        documentRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen, enableFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsGesturing(false);
    } else if (e.touches.length === 2) {
      const distance = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      setLastTouchDistance(distance);
      setIsGesturing(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isGesturing) {
      e.preventDefault();
      const distance = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      
      if (lastTouchDistance > 0) {
        const scaleChange = distance / lastTouchDistance;
        setScale(prev => Math.max(0.25, Math.min(prev * scaleChange, 5)));
      }
      
      setLastTouchDistance(distance);
    }
  }, [isGesturing, lastTouchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0 && touchStart && !isGesturing) {
      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStart.x;
      const deltaY = touchEnd.clientY - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Swipe gestures
      if (distance > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          handlePrevPage(); // Swipe right = previous page
        } else {
          handleNextPage(); // Swipe left = next page
        }
      }
    }
    
    setTouchStart(null);
    setIsGesturing(false);
    setLastTouchDistance(0);
  }, [touchStart, isGesturing, handlePrevPage, handleNextPage]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !enableSearch) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    setIsSearching(true);
    try {
      // This is a simplified search implementation
      // In a real-world scenario, you'd use PDF.js text layer extraction
      const results: SearchResult[] = [];
      
      // Mock search results for demonstration
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        if (query.toLowerCase().includes('test') || query.toLowerCase().includes('document')) {
          results.push({
            pageNumber,
            matches: [
              {
                text: query,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80,
                width: 10,
                height: 3
              }
            ]
          });
        }
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      
      if (results.length > 0) {
        goToPage(results[0].pageNumber);
        toast.success(`Found ${results.length} matches`);
      } else {
        toast.info('No matches found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [enableSearch, numPages, goToPage]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!enableDownload) return;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  }, [fileUrl, enableDownload]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!enablePrint) return;
    
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('Please allow pop-ups to print');
    }
  }, [fileUrl, enablePrint]);

  // Signature field handlers (existing functionality)
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
      x: Math.max(0, Math.min(x - 5, 90)),
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

  // Render signature field
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

  // Render field toolbox
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
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Signature Fields</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
          <p className="text-xs text-muted-foreground mt-2">
            Drag fields to document • Right-click to remove
          </p>
        </CardContent>
      </Card>
    );
  };

  // Render thumbnail sidebar
  const renderThumbnailSidebar = () => {
    if (!showThumbnails || numPages === 0) return null;

    const ThumbnailContent = () => (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Pages</h3>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnailSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 pr-2">
            {Array.from(new Array(numPages), (el, index) => (
              <div
                key={`thumb_${index + 1}`}
                className={cn(
                  "border rounded cursor-pointer transition-all duration-200 hover:border-blue-500",
                  currentPage === index + 1 ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
                onClick={() => goToPage(index + 1)}
              >
                <div className="p-2">
                  <div className="aspect-[3/4] bg-white border rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                    <Document
                      file={fileUrl}
                      onLoadSuccess={() => {}}
                      onLoadError={() => {}}
                    >
                      <Page
                        pageNumber={index + 1}
                        scale={0.2}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-medium">Page {index + 1}</p>
                    {searchResults.some(result => result.pageNumber === index + 1) && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {searchResults.find(result => result.pageNumber === index + 1)?.matches.length} matches
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );

    if (isMobile) {
      return (
        <Sheet open={showThumbnailSidebar} onOpenChange={setShowThumbnailSidebar}>
          <SheetContent side="left" className="w-64">
            <ThumbnailContent />
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Card className="w-64 h-fit">
        <CardContent className="p-4">
          <ThumbnailContent />
        </CardContent>
      </Card>
    );
  };

  // Render search controls
  const renderSearchControls = () => {
    if (!enableSearch) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-48"
            disabled={isSearching}
          />
        </div>
        
        {searchResults.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newIndex = Math.max(0, currentSearchIndex - 1);
                setCurrentSearchIndex(newIndex);
                goToPage(searchResults[newIndex].pageNumber);
              }}
              disabled={currentSearchIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm px-2">
              {currentSearchIndex + 1} of {searchResults.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newIndex = Math.min(searchResults.length - 1, currentSearchIndex + 1);
                setCurrentSearchIndex(newIndex);
                goToPage(searchResults[newIndex].pageNumber);
              }}
              disabled={currentSearchIndex >= searchResults.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Main render
  return (
    <div className={cn("space-y-4", className)} ref={documentRef}>
      {renderFieldToolbox()}
      
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {showThumbnails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThumbnailSidebar(!showThumbnailSidebar)}
                >
                  <Menu className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Pages</span>}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium whitespace-nowrap">
                Page {currentPage} of {numPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search controls */}
            {!isMobile && renderSearchControls()}
            
            {/* Right controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-20">
                <span className="text-sm font-medium">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleZoomToFit}>
                <Expand className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {enableDownload && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Download</span>}
                </Button>
              )}
              
              {enablePrint && (
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Print</span>}
                </Button>
              )}
              
              {enableFullscreen && (
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  {!isMobile && <span className="ml-2">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>}
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile search */}
          {isMobile && enableSearch && (
            <div className="mt-3 pt-3 border-t">
              {renderSearchControls()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="flex gap-4">
        {/* Thumbnail sidebar - desktop */}
        {!isMobile && showThumbnailSidebar && renderThumbnailSidebar()}
        
        {/* PDF Document */}
        <div className="flex-1">
          <div 
            ref={containerRef}
            className={cn(
              "border border-gray-300 rounded-lg overflow-auto bg-gray-100 transition-all duration-200",
              isFullscreen ? "fixed inset-0 z-50 rounded-none" : "max-h-[70vh]"
            )}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
              <div
                className="relative bg-white shadow-lg"
                onDrop={(e) => handleDrop(e, currentPage)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  rotate={rotation}
                  onLoadSuccess={onPageLoadSuccess}
                  className="relative"
                />
                
                {/* Render signature fields for current page */}
                {signatureFields
                  .filter(field => field.pageNumber === currentPage)
                  .map(field => renderSignatureField(field, currentPage))}
                
                {/* Search highlights */}
                {searchResults
                  .filter(result => result.pageNumber === currentPage)
                  .map((result, resultIndex) => 
                    result.matches.map((match, matchIndex) => (
                      <div
                        key={`search-${resultIndex}-${matchIndex}`}
                        className="absolute bg-yellow-200 bg-opacity-50 border border-yellow-400 pointer-events-none"
                        style={{
                          left: `${match.x}%`,
                          top: `${match.y}%`,
                          width: `${match.width}%`,
                          height: `${match.height}%`,
                          zIndex: 5
                        }}
                      />
                    ))
                  )}
                
                {/* Drop overlay */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 flex items-center justify-center">
                    <p className="text-blue-600 font-medium">Drop field here</p>
                  </div>
                )}
              </div>
            </Document>
          </div>
        </div>
      </div>

      {/* Mobile thumbnail sidebar */}
      {isMobile && renderThumbnailSidebar()}

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
