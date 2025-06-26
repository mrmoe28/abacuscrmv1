
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentStatusBadge } from './document-status-badge';
import { SignerStatusBadge } from './signer-status-badge';
import { AuditLog } from './audit-log';
import { PDFViewerWrapper as PDFViewer } from './pdf-viewer-wrapper';
import { 
  FileText, 
  Download, 
  Send, 
  Users,
  Calendar,
  User,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface DocumentDetails {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  uploadedBy: {
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deal?: {
    id: string;
    title: string;
  };
  signerWorkflows: Array<{
    id: string;
    signerName: string;
    signerEmail: string;
    signerRole?: string;
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
    signingOrder: number;
    sentAt?: Date;
    viewedAt?: Date;
    signedAt?: Date;
    declinedAt?: Date;
    contact?: {
      id: string;
      firstName: string;
      lastName: string;
    };
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
    signature?: {
      id: string;
      signatureData: string;
      signatureType: string;
      timestamp: Date;
    };
  }>;
  signatures: Array<{
    id: string;
    signatureData: string;
    signatureType: string;
    timestamp: Date;
    signer: {
      signerName: string;
      signerEmail: string;
    };
    field: {
      type: string;
      label?: string;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    description?: string;
    timestamp: Date;
    user?: {
      name: string;
      email: string;
    };
    ipAddress?: string;
    metadata?: any;
  }>;
}

interface DocumentDetailsViewProps {
  documentId: string;
}

export function DocumentDetailsView({ documentId }: DocumentDetailsViewProps) {
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

  const handleSendDocument = async () => {
    if (!document) return;

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
      await fetchDocument(); // Refresh document details
    } catch (error) {
      console.error('Error sending document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send document');
    } finally {
      setSending(false);
    }
  };

  const handleSendReminder = async (signerId: string) => {
    try {
      // TODO: Implement reminder API
      toast.success('Reminder sent successfully');
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  const getSigningProgress = () => {
    if (!document) return { signed: 0, total: 0, percentage: 0 };
    
    const totalSigners = document.signerWorkflows.length;
    const signedSigners = document.signerWorkflows.filter(s => s.status === 'SIGNED').length;
    const percentage = totalSigners > 0 ? Math.round((signedSigners / totalSigners) * 100) : 0;
    
    return { signed: signedSigners, total: totalSigners, percentage };
  };

  const getCurrentSigner = () => {
    if (!document || document.status === 'COMPLETED') return null;
    
    return document.signerWorkflows
      .sort((a, b) => a.signingOrder - b.signingOrder)
      .find(signer => signer.status === 'SENT' || signer.status === 'VIEWED');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
          The document you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/esignatures">Back to E-Signatures</Link>
        </Button>
      </div>
    );
  }

  const progress = getSigningProgress();
  const currentSigner = getCurrentSigner();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {document.title}
            </h1>
            <DocumentStatusBadge status={document.status} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{document.fileName}</span>
            <span>•</span>
            <span>Created {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
            <span>•</span>
            <span>by {document.uploadedBy.name}</span>
          </div>

          {document.deal && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Associated with </span>
              <Link 
                href={`/deals/${document.deal.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {document.deal.title}
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {document.status === 'DRAFT' && (
            <Button variant="outline" asChild>
              <Link href={`/esignatures/${document.id}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Link>
            </Button>
          )}
          
          {document.status === 'COMPLETED' && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
          
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View PDF
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {currentSigner && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  Waiting for signature from {currentSigner.signerName}
                </p>
                <p className="text-sm text-orange-700">
                  Document was sent to {currentSigner.signerEmail} {
                    currentSigner.sentAt && formatDistanceToNow(new Date(currentSigner.sentAt), { addSuffix: true })
                  }
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminder(currentSigner.id)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PDFViewer
                fileUrl={document.filePath}
                signatureFields={document.signatureFields.map(field => ({
                  ...field,
                  value: field.signature?.signatureData,
                  isSigned: !!field.signature,
                }))}
                isEditable={document.status === 'DRAFT'}
                isSigningMode={false}
                showThumbnails={true}
                enableSearch={true}
                enableFullscreen={true}
                enableDownload={document.status === 'COMPLETED'}
                enablePrint={true}
                className="min-h-[600px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Signing Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress.signed}/{progress.total}</p>
                  <p className="text-sm text-gray-600">Signers completed</p>
                </div>

                {document.completedAt && (
                  <div className="text-center text-green-600 text-sm">
                    ✓ Completed {formatDistanceToNow(new Date(document.completedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Signers ({document.signerWorkflows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.signerWorkflows
                  .sort((a, b) => a.signingOrder - b.signingOrder)
                  .map((signer) => (
                  <div key={signer.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant="outline" className="mt-1">
                      {signer.signingOrder}
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {signer.signerName}
                        </p>
                        <SignerStatusBadge status={signer.status} />
                      </div>
                      
                      <p className="text-xs text-gray-600 truncate">
                        {signer.signerEmail}
                      </p>
                      
                      {signer.signerRole && (
                        <p className="text-xs text-gray-500">
                          {signer.signerRole}
                        </p>
                      )}
                      
                      {signer.signedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Signed {formatDistanceToNow(new Date(signer.signedAt), { addSuffix: true })}
                        </p>
                      )}
                      
                      {signer.contact && (
                        <Link
                          href={`/contacts/${signer.contact.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View in CRM →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Created</span>
                <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Updated</span>
                <span>{format(new Date(document.updatedAt), 'MMM d, yyyy')}</span>
              </div>
              
              {document.expiresAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Expires</span>
                  <span className={new Date(document.expiresAt) < new Date() ? 'text-red-600' : ''}>
                    {format(new Date(document.expiresAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Signature Fields</span>
                <span>{document.signatureFields.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed Fields</span>
                <span>{document.signatures.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Audit Log */}
      <AuditLog
        entries={document.auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          description: log.description,
          timestamp: new Date(log.timestamp),
          userName: log.user?.name,
          ipAddress: log.ipAddress,
          metadata: log.metadata,
        }))}
      />
    </div>
  );
}
