
'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Pen, Type, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => void;
  fieldLabel?: string;
}

export function SignaturePad({ isOpen, onClose, onSave, fieldLabel = 'Signature' }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [activeTab, setActiveTab] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fonts = [
    { value: 'cursive', label: 'Cursive', style: 'Dancing Script, cursive' },
    { value: 'script', label: 'Script', style: 'Great Vibes, cursive' },
    { value: 'handwriting', label: 'Handwriting', style: 'Kalam, cursive' },
    { value: 'signature', label: 'Signature', style: 'Allura, cursive' }
  ];

  useEffect(() => {
    if (isOpen && signatureRef.current) {
      signatureRef.current.clear();
    }
  }, [isOpen]);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setTypedSignature('');
    setUploadedImage(null);
  };

  const handleSave = () => {
    let signatureData = '';
    let signatureType: 'drawn' | 'typed' | 'uploaded' = 'drawn';

    try {
      if (activeTab === 'draw') {
        if (signatureRef.current?.isEmpty()) {
          toast.error('Please draw your signature');
          return;
        }
        signatureData = signatureRef.current?.toDataURL() || '';
        signatureType = 'drawn';
      } else if (activeTab === 'type') {
        if (!typedSignature.trim()) {
          toast.error('Please enter your signature');
          return;
        }
        
        // Create a canvas to render the typed signature
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 400;
        canvas.height = 100;
        
        // Set font and styling
        const selectedFontObj = fonts.find(f => f.value === selectedFont);
        ctx.font = `32px ${selectedFontObj?.style || 'cursive'}`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        ctx.fillStyle = '#000000';
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
        
        signatureData = canvas.toDataURL();
        signatureType = 'typed';
      } else if (activeTab === 'upload') {
        if (!uploadedImage) {
          toast.error('Please upload a signature image');
          return;
        }
        signatureData = uploadedImage;
        signatureType = 'uploaded';
      }

      onSave(signatureData, signatureType);
      toast.success('Signature saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {fieldLabel}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pen className="h-4 w-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'signature-canvas bg-white w-full',
                  style: { border: '1px solid #e5e7eb', borderRadius: '4px' }
                }}
                backgroundColor="white"
                penColor="black"
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Sign above using your mouse or touch screen
            </p>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="typed-signature">Type your signature</Label>
                <Input
                  id="typed-signature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="font-select">Choose font style</Label>
                <select
                  id="font-select"
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fonts.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              {typedSignature && (
                <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[100px] flex items-center justify-center">
                  <span
                    style={{
                      fontFamily: fonts.find(f => f.value === selectedFont)?.style,
                      fontSize: '32px',
                      color: '#000000'
                    }}
                  >
                    {typedSignature}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-32 mx-auto border border-gray-300 rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Upload signature image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Signature
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
