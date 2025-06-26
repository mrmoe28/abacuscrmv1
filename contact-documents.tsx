
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentStatusBadge } from './document-status-badge';
import { SignerStatusBadge } from './signer-status-badge';
import { 
  FileText, 
  Calendar,
  User,
  Eye,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ContactDocument {
  id: string;
  title: string;
  fileName: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  createdAt: Date;
  completedAt?: Date;
  deal?: {
    id: string;
    title: string;
  };
  uploadedBy: {
    name: string;
    email: string;
  };
  signerWorkflows: Array<{
    id: string;
    signerName: string;
    signerEmail: string;
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
    signedAt?: Date;
  }>;
}

interface ContactDocumentsProps {
  contactId: string;
  contactName: string;
  contactEmail?: string;
  className?: string;
}

export function ContactDocuments({ 
  contactId, 
  contactName, 
  contactEmail,
  className = '' 
}: ContactDocumentsProps) {
  const [documents, setDocuments] = useState<ContactDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [contactId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/esignature/documents?contactId=${contactId}`);
      
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

  const getContactSignerStatus = (doc: ContactDocument) => {
    if (!contactEmail) return null;
    
    return doc.signerWorkflows.find(signer => 
      signer.signerEmail.toLowerCase() === contactEmail.toLowerCase()
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Signed Documents
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signed Documents
          {documents.length > 0 && (
            <Badge variant="secondary">{documents.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {contactName} hasn't been involved in any document signing yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const signerStatus = getContactSignerStatus(doc);
              
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
                      <div className="flex items-center gap-2">
                        <DocumentStatusBadge status={doc.status} />
                        {signerStatus && (
                          <SignerStatusBadge status={signerStatus.status} />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {doc.completedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Completed {formatDistanceToNow(new Date(doc.completedAt), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>by {doc.uploadedBy.name}</span>
                      </div>
                      
                      {doc.deal && (
                        <div className="flex items-center gap-1">
                          <span>for </span>
                          <Link 
                            href={`/deals/${doc.deal.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {doc.deal.title}
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {signerStatus?.signedAt && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Signed by {contactName} {formatDistanceToNow(new Date(signerStatus.signedAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/esignatures/${doc.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    {doc.status === 'COMPLETED' && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
