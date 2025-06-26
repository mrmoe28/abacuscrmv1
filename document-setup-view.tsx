
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFViewer } from './pdf-viewer';
import { SignerSetupModal } from './signer-setup-modal';
import { DocumentStatusBadge } from './document-status-badge';
import { 
  FileText, 
  Users, 
  Send, 
  Eye, 
  Settings,
  Plus,
  AlertTriangle,
  CheckCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DocumentDetails {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  createdAt: Date;
  signerWorkflows: Array<{
    id: string;
    signerName: string;
    signerEmail: string;
    signerRole?: string;
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
    signingOrder: number;
  }>;
  signatureFields: Array<{
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
  }>;
}

interface SignatureFieldData {
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
}

interface DocumentSetupViewProps {
  documentId: string;
}

export function DocumentSetupView({ documentId }: DocumentSetupViewProps) {
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');

  const router = useRouter();

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/esignature/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldAdd = async (field: Omit<SignatureFieldData, 'id'>) => {
    try {
      const response = await fetch(`/api/esignature/documents/${documentId}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(field),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add field');
      }

      await fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add field');
    }
  };

  const handleFieldRemove = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/esignature/documents/${documentId}/fields/${fieldId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove field');
      }

      await fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error removing field:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove field');
    }
  };

  const handleSendDocument = async () => {
    if (!document) return;

    // Validation
    if (document.signerWorkflows.length === 0) {
      toast.error('Please add at least one signer before sending');
      setActiveTab('signers');
      return;
    }

    if (document.signatureFields.length === 0) {
      toast.error('Please add signature fields before sending');
      setActiveTab('fields');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/esignature/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          emailSubject: `Please sign: ${document.title}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send document');
      }

      toast.success('Document sent for signing successfully');
      router.push(`/esignatures/${document.id}`);
    } catch (error) {
      console.error('Error sending document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send document');
    } finally {
      setSending(false);
    }
  };

  const getSetupProgress = () => {
    if (!document) return { completed: 0, total: 3, items: [] };

    const items = [
      {
        label: 'Document uploaded',
        completed: true,
        description: 'PDF document is ready'
      },
      {
        label: 'Signers added',
        completed: document.signerWorkflows.length > 0,
        description: `${document.signerWorkflows.length} signer(s) configured`
      },
      {
        label: 'Signature fields added',
        completed: document.signatureFields.length > 0,
        description: `${document.signatureFields.length} field(s) positioned`
      }
    ];

    const completed = items.filter(item => item.completed).length;
    return { completed, total: items.length, items };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
        <p className="text-gray-600 mb-4">
          The document you're trying to setup doesn't exist or you don't have permission to edit it.
        </p>
        <Button asChild>
          <Link href="/esignatures">Back to E-Signatures</Link>
        </Button>
      </div>
    );
  }

  if (document.status !== 'DRAFT') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-orange-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Document cannot be edited</h3>
        <p className="text-gray-600 mb-4">
          This document has already been sent for signing and cannot be modified.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/esignatures">Back to E-Signatures</Link>
          </Button>
          <Button asChild>
            <Link href={`/esignatures/${document.id}`}>View Document</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progress = getSetupProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              Setup: {document.title}
            </h1>
            <DocumentStatusBadge status={document.status} />
          </div>
          
          <p className="text-gray-600">
            Configure signers and signature fields before sending the document
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/esignatures/${document.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          
          <Button 
            onClick={handleSendDocument}
            disabled={sending || progress.completed < progress.total}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send for Signing'}
          </Button>
        </div>
      </div>

      {/* Setup Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Progress ({progress.completed}/{progress.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progress.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${item.completed ? 'text-green-900' : 'text-gray-600'}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Setup Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Setup Controls */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
            <TabsList className="grid w-full grid-rows-2">
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Signature Fields
                <Badge variant="secondary" className="ml-auto">
                  {document.signatureFields.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="signers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signers
                <Badge variant="secondary" className="ml-auto">
                  {document.signerWorkflows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Signature Fields</CardTitle>
                  <p className="text-sm text-gray-600">
                    Drag field types onto the document to add signature areas
                  </p>
                </CardHeader>
                <CardContent>
                  {document.signatureFields.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        No signature fields added yet. Drag fields from the PDF viewer to add them.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Fields by page:</p>
                      {Object.entries(
                        document.signatureFields.reduce((acc, field) => {
                          const page = field.pageNumber;
                          if (!acc[page]) acc[page] = [];
                          acc[page].push(field);
                          return acc;
                        }, {} as Record<number, typeof document.signatureFields>)
                      ).map(([page, fields]) => (
                        <div key={page} className="text-sm">
                          <span className="font-medium">Page {page}:</span>
                          <span className="ml-2 text-gray-600">
                            {fields.length} field{fields.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signers" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Document Signers</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSignerModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Signers
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.signerWorkflows.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        No signers added yet. Add people who need to sign this document.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowSignerModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Signer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {document.signerWorkflows
                        .sort((a, b) => a.signingOrder - b.signingOrder)
                        .map((signer, index) => (
                        <div key={signer.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="outline">
                            {signer.signingOrder}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {signer.signerName}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {signer.signerEmail}
                            </p>
                            {signer.signerRole && (
                              <p className="text-xs text-gray-500">
                                {signer.signerRole}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview & Field Setup</CardTitle>
              <p className="text-sm text-gray-600">
                Drag signature field types onto the document to position them where signers should sign
              </p>
            </CardHeader>
            <CardContent>
              <PDFViewer
                fileUrl={document.filePath}
                signatureFields={document.signatureFields}
                isEditable={true}
                isSigningMode={false}
                onFieldAdd={handleFieldAdd}
                onFieldRemove={handleFieldRemove}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signer Setup Modal */}
      <SignerSetupModal
        isOpen={showSignerModal}
        onClose={() => setShowSignerModal(false)}
        documentId={documentId}
        existingSigners={document.signerWorkflows}
        onSignersUpdate={fetchDocument}
      />
    </div>
  );
}
