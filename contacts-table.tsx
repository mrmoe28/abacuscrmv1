
"use client"

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClientDateOnly } from '@/components/ui/client-date';
import { formatPhoneNumber } from '@/lib/utils';
import { useSettings } from '@/components/settings/settings-provider';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

interface Contact {
  id: string;
  type: string;
  source?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  tags: string[];
  isActive: boolean;
  lastContactedAt?: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    deals: number;
    tasks: number;
    appointments: number;
  };
}

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: 'delete' | 'disable' | 'enable') => void;
  onClear: () => void;
  isLoading: boolean;
}

// Bulk Action Bar Component
function BulkActionBar({ selectedCount, onAction, onClear, isLoading }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('enable')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Enable
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('disable')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
            Disable
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onAction('delete')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContactsTable() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contactId?: string;
    contactName?: string;
    isBulk?: boolean;
    count?: number;
  }>({ open: false });

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/contacts?limit=100');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts');
      }
      
      setContacts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchContacts();
    }
  }, [session]);

  // Handle individual contact selection
  const handleContactSelect = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  // Delete single contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contact');
      }
      
      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== contactId));
      
      toast({
        title: "Success",
        description: data.message || "Contact deleted successfully",
      });
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete contact",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false });
    }
  };

  // Toggle contact status
  const handleToggleStatus = async (contactId: string, newStatus: boolean) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contact status');
      }
      
      // Update local state
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, isActive: newStatus } : c
      ));
      
      toast({
        title: "Success",
        description: data.message || `Contact ${newStatus ? 'enabled' : 'disabled'} successfully`,
      });
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update contact status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'disable' | 'enable') => {
    const contactIds = Array.from(selectedContacts);
    
    if (action === 'delete') {
      const selectedContactNames = contacts
        .filter(c => selectedContacts.has(c.id))
        .map(c => `${c.firstName} ${c.lastName}`);
      
      setDeleteDialog({
        open: true,
        isBulk: true,
        count: contactIds.length,
      });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'enable' ? 'enable' : 'disable',
          contactIds,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} contacts`);
      }
      
      // Update local state
      const newStatus = action === 'enable';
      setContacts(prev => prev.map(c => 
        selectedContacts.has(c.id) ? { ...c, isActive: newStatus } : c
      ));
      
      setSelectedContacts(new Set());
      
      toast({
        title: "Success",
        description: data.message || `${contactIds.length} contact(s) ${action}d successfully`,
      });
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${action} contacts`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    const contactIds = Array.from(selectedContacts);
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          contactIds,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contacts');
      }
      
      // Remove from local state
      setContacts(prev => prev.filter(c => !selectedContacts.has(c.id)));
      setSelectedContacts(new Set());
      
      toast({
        title: "Success",
        description: data.message || `${contactIds.length} contact(s) deleted successfully`,
      });
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete contacts",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CUSTOMER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'VENDOR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'WEBSITE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'REFERRAL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'COLD_CALL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'MARKETING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'SOCIAL_MEDIA':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'TRADE_SHOW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading contacts...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading contacts: {error}</div>
      </div>
    );
  }

  const allSelected = contacts.length > 0 && selectedContacts.size === contacts.length;
  const partialSelected = selectedContacts.size > 0 && selectedContacts.size < contacts.length;

  return (
    <div className="space-y-4">
      <Table data-tutorial-id="contacts-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all contacts"
                {...(partialSelected && { 'data-state': 'indeterminate' })}
              />
            </TableHead>
            <TableHead>Contact</TableHead>
            {settings.contacts.columns.status && <TableHead>Status</TableHead>}
            {settings.contacts.columns.type && <TableHead>Type</TableHead>}
            {settings.contacts.columns.source && <TableHead>Source</TableHead>}
            {settings.contacts.columns.company && <TableHead>Company</TableHead>}
            {settings.contacts.columns.contactInfo && <TableHead>Contact Info</TableHead>}
            {settings.contacts.columns.activity && <TableHead>Activity</TableHead>}
            {settings.contacts.columns.lastContact && <TableHead>Last Contact</TableHead>}
            {settings.contacts.columns.owner && <TableHead>Owner</TableHead>}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedContacts.has(contact.id)}
                  onCheckedChange={(checked) => handleContactSelect(contact.id, !!checked)}
                  aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </div>
                  {contact.title && (
                    <div className="text-sm text-muted-foreground">{contact.title}</div>
                  )}
                  {contact.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              {settings.contacts.columns.status && (
                <TableCell>
                  <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                    {contact.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
              )}
              {settings.contacts.columns.type && (
                <TableCell>
                  <Badge className={getTypeColor(contact.type)}>
                    {contact.type.toLowerCase()}
                  </Badge>
                </TableCell>
              )}
              {settings.contacts.columns.source && (
                <TableCell>
                  {contact.source && (
                    <Badge variant="outline" className={getSourceColor(contact.source)}>
                      {contact.source.toLowerCase().replace('_', ' ')}
                    </Badge>
                  )}
                </TableCell>
              )}
              {settings.contacts.columns.company && (
                <TableCell>
                  <div className="text-sm">
                    {contact.company || '-'}
                  </div>
                </TableCell>
              )}
              {settings.contacts.columns.contactInfo && (
                <TableCell>
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-40">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{formatPhoneNumber(contact.phone)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              )}
              {settings.contacts.columns.activity && (
                <TableCell>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>{contact._count.deals} deals</span>
                    <span>{contact._count.tasks} tasks</span>
                    <span>{contact._count.appointments} appts</span>
                  </div>
                </TableCell>
              )}
              {settings.contacts.columns.lastContact && (
                <TableCell>
                  <div className="text-sm">
                    {contact.lastContactedAt ? (
                      <ClientDateOnly 
                        date={contact.lastContactedAt}
                        fallback="Loading..."
                      />
                    ) : (
                      'Never'
                    )}
                  </div>
                </TableCell>
              )}
              {settings.contacts.columns.owner && (
                <TableCell>
                  <div className="text-sm">{contact.owner.name}</div>
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu data-tutorial-id="contacts-actions">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={actionLoading}>
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Contact
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(contact.id, !contact.isActive)}
                    >
                      {contact.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => setDeleteDialog({
                        open: true,
                        contactId: contact.id,
                        contactName: `${contact.firstName} ${contact.lastName}`,
                      })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No contacts found</div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedContacts.size > 0 && (
        <BulkActionBar
          selectedCount={selectedContacts.size}
          onAction={handleBulkAction}
          onClear={() => setSelectedContacts(new Set())}
          isLoading={actionLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isBulk
                ? `This will permanently delete ${deleteDialog.count} selected contact(s). This action cannot be undone.`
                : `This will permanently delete ${deleteDialog.contactName}. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.isBulk ? handleBulkDeleteConfirm : () => handleDeleteContact(deleteDialog.contactId!)}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
