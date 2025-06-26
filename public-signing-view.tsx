
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PDFViewerWrapper as PDFViewer } from './pdf-viewer-wrapper';
import { SignaturePad } from './signature-pad';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  User,
  Calendar,
  X,
  Send,
  Eye,
  PenTool
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SigningSession {
  signer: {
    id: string;
    signerName: string;
    signerEmail: string;
    signerRole?: string;
    status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
    signedAt?: Date;
    document: {
      id: string;
      title: string;
      fileName: string;
      filePath: string;
      status: string;
      createdAt: Date;
    };
  };
  allFields: Array<{
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
    signature?: {
      id: string;
      signatureData: string;
      signatureType: string;
      timestamp: Date;
      signer: {
        signerName: string;
        signerEmail: string;
      };
    };
  }>;
  canSign: boolean;
  alreadySigned?: boolean;
}

interface PublicSigningViewProps {
  signingToken: string;
}

export function PublicSigningView({ signingToken }: PublicSigningViewProps) {
  const [session, setSession] = useState<SigningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentField, setCurrentField] = useState<any>(null);

  useEffect(() => {
    fetchSigningSession();
  }, [signingToken]);

  const fetchSigningSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/esignature/sign/${signingToken}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invalid signing link or document not found');
        } else if (response.status === 410) {
          setError('This document has expired and can no longer be signed');
        } else if (response.status === 423) {
          setError('Please wait for previous signers to complete signing');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load signing session');
        }
        return;
      }

      const data = await response.json();
      setSession(data);
      
      if (data.alreadySigned) {
        toast.success('Document has already been signed');
      }
    } catch (error) {
      console.error('Error fetching signing session:', error);
      setError('Failed to load signing session');
    } finally {
      setLoading(false);
    }
  };

  const getMyFields = () => {
    if (!session) return [];
    
    return session.allFields.filter(field => 
      !field.signerId || field.signerId === session.signer.id
    );
  };

  const getRequiredFieldsForMe = () => {
    return getMyFields().filter(field => 
      field.required && !field.signature
    );
  };

  const handleFieldSign = async (fieldId: string, signatureData: string, signatureType: string) => {
    try {
      setSigning(true);
      
      const response = await fetch('/api/esignature/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId,
          signatureData,
          signatureType,
          signingToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save signature');
      }

      // Refresh session data
      await fetchSigningSession();
      
      toast.success('Signature saved successfully');
      
      // Check if all required fields are completed
      const requiredFields = getRequiredFieldsForMe();
      if (requiredFields.length === 1) { // This was the last required field
        toast.success('All required fields completed! Document signing finished.');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save signature');
    } finally {
      setSigning(false);
    }
  };

  const handleFieldClick = (field: any) => {
    if (field.signature) {
      toast.info('This field has already been signed');
      return;
    }
    
    if (field.signerId && field.signerId !== session?.signer.id) {
      toast.error('This field is assigned to another signer');
      return;
    }

    setCurrentField(field);
    
    if (field.type === 'SIGNATURE' || field.type === 'INITIALS') {
      setShowSignaturePad(true);
    } else if (field.type === 'DATE') {
      const currentDate = new Date().toLocaleDateString();
      handleFieldSign(field.id, currentDate, 'typed');
    } else if (field.type === 'TEXT') {
      const value = prompt('Enter text:');
      if (value) {
        handleFieldSign(field.id, value, 'typed');
      }
    } else if (field.type === 'CHECKBOX') {
      const isChecked = field.value === 'checked';
      handleFieldSign(field.id, isChecked ? '' : 'checked', 'typed');
    }
  };

  const handleSignatureSave = (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => {
    if (currentField) {
      handleFieldSign(currentField.id, signatureData, signatureType);
      setShowSignaturePad(false);
      setCurrentField(null);
    }
  };

  const handleDeclineDocument = async () => {
    if (!confirm('Are you sure you want to decline to sign this document?')) {
      return;
    }

    const reason = prompt('Please provide a reason for declining (optional):');
    
    try {
      const response = await fetch(`/api/esignature/sign/${signingToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'decline',
          data: { reason: reason || 'No reason provided' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline document');
      }

      toast.success('Document declined successfully');
      await fetchSigningSession();
    } catch (error) {
      console.error('Error declining document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to decline document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Document</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the document sender.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h3>
            <p className="text-gray-600">
              The signing session could not be loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myFields = getMyFields();
  const requiredFields = getRequiredFieldsForMe();
  const isCompleted = session.signer.status === 'SIGNED' || requiredFields.length === 0;

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {session.signer.document.title}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {session.signer.document.fileName}
                </p>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={isCompleted ? "default" : "secondary"}
                  className="mb-2"
                >
                  {isCompleted ? 'Completed' : 'In Progress'}
                </Badge>
                <p className="text-sm text-gray-600">
                  Created {formatDistanceToNow(new Date(session.signer.document.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{session.signer.signerName}</span>
                  {session.signer.signerRole && (
                    <Badge variant="outline">{session.signer.signerRole}</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PenTool className="h-4 w-4" />
                  <span>
                    {myFields.filter(f => f.signature).length} of {myFields.length} fields completed
                  </span>
                </div>
              </div>
              
              {!isCompleted && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDeclineDocument}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Alert */}
        {isCompleted ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Document completed!</strong> All required signatures have been provided.
              {session.signer.signedAt && (
                <span className="block text-sm mt-1">
                  Signed {formatDistanceToNow(new Date(session.signer.signedAt), { addSuffix: true })}
                </span>
              )}
            </AlertDescription>
          </Alert>
        ) : requiredFields.length > 0 ? (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Action required:</strong> Please complete {requiredFields.length} remaining signature field{requiredFields.length !== 1 ? 's' : ''}.
              <span className="block text-sm mt-1">
                Click on the highlighted fields in the document below to sign.
              </span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <Eye className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Review mode:</strong> All required fields are completed. You can review the document.
            </AlertDescription>
          </Alert>
        )}

        {/* PDF Viewer */}
        <Card>
          <CardContent className="p-6">
            <PDFViewer
              fileUrl={session.signer.document.filePath}
              signatureFields={session.allFields.map(field => ({
                ...field,
                value: field.signature?.signatureData,
                isSigned: !!field.signature,
              }))}
              isEditable={false}
              isSigningMode={true}
              currentSignerId={session.signer.id}
              onFieldUpdate={handleFieldClick}
              showThumbnails={true}
              enableSearch={true}
              enableFullscreen={true}
              enableDownload={false}
              enablePrint={true}
              className="min-h-[600px]"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Click on signature fields (highlighted in blue) to sign</p>
                <p>• You can draw, type, or upload your signature</p>
                <p>• All required fields must be completed before submission</p>
                <p>• You can review and modify your signatures before final submission</p>
              </div>
            </CardContent>
          </Card>
        )}
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
    </>
  );
}
