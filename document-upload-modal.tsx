
'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (documentData: {
    title: string;
    description?: string;
    file: File;
    dealId?: string;
    contactId?: string;
  }) => Promise<void>;
  dealId?: string;
  contactId?: string;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  dealId,
  contactId
}: DocumentUploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some(error => error.code === 'file-too-large')) {
          toast.error('File size must be less than 50MB');
        } else if (rejection.errors.some(error => error.code === 'file-invalid-type')) {
          toast.error('Only PDF files are allowed');
        } else {
          toast.error('Invalid file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        if (!title) {
          setTitle(file.name.replace('.pdf', ''));
        }
        toast.success('File selected successfully');
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Upload modal handleSubmit called', {
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
      title: title.trim(),
      onUpload: typeof onUpload
    });
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      toast.error('Please select a PDF file');
      return;
    }

    if (!title.trim()) {
      console.log('❌ No title provided');
      toast.error('Please enter a document title');
      return;
    }

    console.log('✅ Starting upload process...');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('📝 Creating upload data object...');
      const uploadData = {
        title: title.trim(),
        description: description.trim() || undefined,
        file: selectedFile,
        dealId,
        contactId
      };
      console.log('📦 Upload data:', {
        title: uploadData.title,
        description: uploadData.description,
        fileName: uploadData.file.name,
        fileSize: uploadData.file.size,
        dealId: uploadData.dealId,
        contactId: uploadData.contactId
      });

      // Simulate upload progress
      console.log('⏳ Starting progress simulation...');
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      console.log('🔄 Calling onUpload function...');
      await onUpload(uploadData);

      console.log('✅ Upload completed successfully');
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setUploadProgress(0);
      
      toast.success('Document uploaded successfully');
      onClose();
    } catch (error) {
      console.error('❌ Upload error occurred:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast.error('Failed to upload document');
    } finally {
      console.log('🏁 Upload process finished, resetting state...');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document for E-Signature</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Document File (PDF)</Label>
            
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop the PDF here' : 'Upload PDF Document'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Drag and drop your PDF file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 50MB
                  </p>
                </div>
              </div>
            ) : (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this document"
                rows={3}
                disabled={isUploading}
                className="mt-1"
              />
            </div>
          </div>

          {/* Context Information */}
          {(dealId || contactId) && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    This document will be associated with:
                  </p>
                  <p className="text-sm text-blue-700">
                    {dealId && 'Current Deal'}
                    {dealId && contactId && ' and '}
                    {contactId && 'Selected Contact'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedFile || !title.trim() || isUploading}
              onClick={(e) => {
                console.log('🖱️ Upload button clicked!', {
                  hasFile: !!selectedFile,
                  hasTitle: !!title.trim(),
                  isUploading,
                  isDisabled: !selectedFile || !title.trim() || isUploading
                });
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload & Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
