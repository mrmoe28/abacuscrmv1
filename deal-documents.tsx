
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentUploadModal } from './document-upload-modal';
import { DocumentStatusBadge } from './document-status-badge';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Send, 
  Users,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  title: string;
  fileName: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  signerWorkflows: Array<{
    id: string;
    signerName: string;
    signerEmail: string;
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
  }>;
  _count: {
    signatures: number;
    signatureFields: number;
  };
}

interface DealDocumentsProps {
  dealId: string;
  dealTitle: string;
  className?: string;
}

export function DealDocuments({ dealId, dealTitle, className = '' }: DealDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [dealId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/esignature/documents?dealId=${dealId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (documentData: {
    title: string;
    description?: string;
    file: File;
    dealId?: string;
    contactId?: string;
  }) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('title', documentData.title);
      if (documentData.description) {
        formData.append('description', documentData.description);
      }
      formData.append('dealId', dealId);

      const response = await fetch('/api/esignature/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      const result = await response.json();
      
      // Refresh documents list
      await fetchDocuments();
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const getSigningProgress = (doc: Document) => {
    const totalSigners = doc.signerWorkflows.length;
    const signedSigners = doc.signerWorkflows.filter(s => s.status === 'SIGNED').length;
    return { signed: signedSigners, total: totalSigners };
  };

  const getNextAction = (doc: Document) => {
    if (doc.status === 'DRAFT') {
      return { action: 'setup', label: 'Setup Signing', color: 'blue' };
    }
    if (doc.status === 'SENT' || doc.status === 'IN_PROGRESS') {
      const pendingSigner = doc.signerWorkflows.find(s => s.status === 'SENT' || s.status === 'VIEWED');
      if (pendingSigner) {
        return { action: 'waiting', label: `Waiting for ${pendingSigner.signerName}`, color: 'orange' };
      }
    }
    if (doc.status === 'COMPLETED') {
      return { action: 'download', label: 'Download', color: 'green' };
    }
    return { action: 'view', label: 'View', color: 'gray' };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & E-Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents & E-Signatures
              {documents.length > 0 && (
                <Badge variant="secondary">{documents.length}</Badge>
              )}
            </CardTitle>
            <Button onClick={() => setShowUploadModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your first document to start the e-signature process
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const progress = getSigningProgress(doc);
                const nextAction = getNextAction(doc);
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {doc.fileName}
                          </p>
                        </div>
                        <DocumentStatusBadge status={doc.status} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {doc.signerWorkflows.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {progress.signed}/{progress.total} signed
                            </span>
                          </div>
                        )}
                        
                        {doc._count.signatureFields > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>
                              {doc._count.signatures}/{doc._count.signatureFields} fields
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={nextAction.color === 'blue' ? 'default' : 
                               nextAction.color === 'orange' ? 'secondary' :
                               nextAction.color === 'green' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {nextAction.label}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/esignatures/${doc.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          
                          {doc.status === 'DRAFT' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/esignatures/${doc.id}/edit`}>
                                <Send className="h-4 w-4 mr-2" />
                                Setup & Send
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {doc.status === 'COMPLETED' && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        dealId={dealId}
      />
    </>
  );
}
