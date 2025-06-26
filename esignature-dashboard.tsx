
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DocumentUploadModal } from './document-upload-modal';
import { DocumentStatusBadge } from './document-status-badge';
import { EnhancedPdfUploadModal } from '../documents/enhanced-pdf-upload-modal';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Send,
  Download,
  Users,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  Upload
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  title: string;
  fileName: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  uploadedBy: {
    name: string;
    email: string;
  };
  contact?: {
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
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
  }>;
  _count: {
    signatures: number;
    signatureFields: number;
  };
}

interface DashboardStats {
  total: number;
  draft: number;
  sent: number;
  inProgress: number;
  completed: number;
  voided: number;
}

export function ESignatureDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    sent: 0,
    inProgress: 0,
    completed: 0,
    voided: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/esignature/documents?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      
      // Calculate stats
      const allDocs = data.documents || [];
      setStats({
        total: allDocs.length,
        draft: allDocs.filter((d: Document) => d.status === 'DRAFT').length,
        sent: allDocs.filter((d: Document) => d.status === 'SENT').length,
        inProgress: allDocs.filter((d: Document) => d.status === 'IN_PROGRESS').length,
        completed: allDocs.filter((d: Document) => d.status === 'COMPLETED').length,
        voided: allDocs.filter((d: Document) => d.status === 'VOIDED').length,
      });
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
      console.log('🎯 Dashboard handleUpload called with data:', {
        title: documentData.title,
        description: documentData.description,
        fileName: documentData.file.name,
        fileSize: documentData.file.size,
        fileType: documentData.file.type,
        dealId: documentData.dealId,
        contactId: documentData.contactId
      });

      console.log('📋 Creating FormData...');
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('title', documentData.title);
      if (documentData.description) {
        formData.append('description', documentData.description);
      }
      if (documentData.dealId) {
        formData.append('dealId', documentData.dealId);
      }
      if (documentData.contactId) {
        formData.append('contactId', documentData.contactId);
      }

      console.log('🌐 Making API request to /api/esignature/documents...');
      const response = await fetch('/api/esignature/documents', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error response:', error);
        throw new Error(error.error || 'Failed to upload document');
      }

      const result = await response.json();
      console.log('✅ API success response:', result);

      console.log('🔄 Refreshing documents list...');
      await fetchDocuments();
      
      toast.success('Document uploaded successfully');
      console.log('🎉 Upload process completed successfully');
    } catch (error) {
      console.error('❌ Dashboard upload error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  };

  const handlePdfUploadComplete = (document: {
    id: string;
    title: string;
    description?: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    status: string;
    uploadedBy: {
      id: string;
      name: string;
      email: string;
    };
  }) => {
    // Refresh documents list to show the new upload
    fetchDocuments();
    toast.success(`Document "${document.title}" uploaded successfully!`);
  };

  const filteredDocuments = documents.filter(doc =>
    searchTerm === '' || 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSigningProgress = (doc: Document) => {
    const totalSigners = doc.signerWorkflows.length;
    const signedSigners = doc.signerWorkflows.filter(s => s.status === 'SIGNED').length;
    return { signed: signedSigners, total: totalSigners };
  };

  const getNextAction = (doc: Document) => {
    if (doc.status === 'DRAFT') {
      return { action: 'setup', label: 'Setup Signing', color: 'blue', href: `/esignatures/${doc.id}/edit` };
    }
    if (doc.status === 'SENT' || doc.status === 'IN_PROGRESS') {
      const pendingSigner = doc.signerWorkflows.find(s => s.status === 'SENT' || s.status === 'VIEWED');
      if (pendingSigner) {
        return { action: 'waiting', label: `Waiting for ${pendingSigner.signerName}`, color: 'orange', href: `/esignatures/${doc.id}` };
      }
    }
    if (doc.status === 'COMPLETED') {
      return { action: 'download', label: 'Download', color: 'green', href: `/esignatures/${doc.id}` };
    }
    return { action: 'view', label: 'View', color: 'gray', href: `/esignatures/${doc.id}` };
  };

  const StatCard = ({ icon: Icon, title, value, color, description }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: number;
    color: string;
    description?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color} mr-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            title="Total Documents"
            value={stats.total}
            color="bg-blue-500"
            description="All e-signature documents"
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={stats.inProgress + stats.sent}
            color="bg-orange-500"
            description="Awaiting signatures"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={stats.completed}
            color="bg-green-500"
            description="Fully signed documents"
          />
          <StatCard
            icon={TrendingUp}
            title="Success Rate"
            value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
            color="bg-purple-500"
            description="Completion percentage"
          />
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Documents</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPdfUploadModal(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {documents.length === 0 ? 'No documents yet' : 'No documents found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {documents.length === 0 
                    ? 'Upload your first document to start the e-signature process'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {documents.length === 0 && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
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
                          
                          <div className="flex items-center gap-1">
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
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={nextAction.href}>
                            {nextAction.action === 'setup' && <Send className="h-4 w-4 mr-2" />}
                            {nextAction.action === 'view' && <Eye className="h-4 w-4 mr-2" />}
                            {nextAction.action === 'download' && <Download className="h-4 w-4 mr-2" />}
                            {nextAction.action === 'waiting' && <Clock className="h-4 w-4 mr-2" />}
                            {nextAction.label}
                          </Link>
                        </Button>
                        
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
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                              </>
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
      </div>

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      <EnhancedPdfUploadModal
        isOpen={showPdfUploadModal}
        onClose={() => setShowPdfUploadModal(false)}
        onUploadComplete={handlePdfUploadComplete}
        title="Upload PDF for E-Signature"
        description="Upload a PDF document that will be saved to your e-signature dashboard and available for signing workflows."
      />
    </>
  );
}
