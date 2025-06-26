
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Send, 
  Eye, 
  PenTool, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Mail
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  action: string;
  description?: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  signerId?: string;
  signerName?: string;
  signerEmail?: string;
  ipAddress?: string;
  metadata?: any;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
  className?: string;
}

export function AuditLog({ entries, className = '' }: AuditLogProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'document_created':
      case 'document_uploaded':
        return FileText;
      case 'document_sent':
      case 'signer_invited':
      case 'email_sent':
        return Send;
      case 'document_viewed':
      case 'signer_viewed':
        return Eye;
      case 'signature_completed':
      case 'field_signed':
        return PenTool;
      case 'document_completed':
      case 'signing_completed':
        return CheckCircle;
      case 'document_voided':
      case 'signer_declined':
        return XCircle;
      case 'reminder_sent':
        return Mail;
      default:
        return Clock;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'document_created':
      case 'document_uploaded':
        return 'text-blue-600';
      case 'document_sent':
      case 'signer_invited':
      case 'email_sent':
        return 'text-indigo-600';
      case 'document_viewed':
      case 'signer_viewed':
        return 'text-orange-600';
      case 'signature_completed':
      case 'field_signed':
        return 'text-purple-600';
      case 'document_completed':
      case 'signing_completed':
        return 'text-green-600';
      case 'document_voided':
      case 'signer_declined':
        return 'text-red-600';
      case 'reminder_sent':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatActionLabel = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (entries.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No activity recorded yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Activity Log</h3>
        <p className="text-sm text-gray-600">
          Complete audit trail of document activities
        </p>
      </div>
      
      <ScrollArea className="h-96">
        <div className="p-4 space-y-4">
          {sortedEntries.map((entry, index) => {
            const Icon = getActionIcon(entry.action);
            const colorClass = getActionColor(entry.action);
            
            return (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < sortedEntries.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 mt-2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {formatActionLabel(entry.action)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {entry.description || formatActionLabel(entry.action)}
                      </p>
                      
                      {/* Actor information */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {entry.userName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{entry.userName}</span>
                          </div>
                        )}
                        {entry.signerName && (
                          <div className="flex items-center gap-1">
                            <PenTool className="h-3 w-3" />
                            <span>{entry.signerName}</span>
                            {entry.signerEmail && (
                              <span className="text-gray-500">({entry.signerEmail})</span>
                            )}
                          </div>
                        )}
                        {entry.ipAddress && (
                          <span className="text-gray-500">
                            IP: {entry.ipAddress}
                          </span>
                        )}
                      </div>
                      
                      {/* Additional metadata */}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <details>
                            <summary className="cursor-pointer text-gray-600">
                              View Details
                            </summary>
                            <pre className="mt-1 text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
