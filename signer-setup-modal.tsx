
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SignerStatusBadge } from './signer-status-badge';
import { 
  Plus, 
  X, 
  Users, 
  Mail,
  User,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Signer {
  id?: string;
  signerEmail: string;
  signerName: string;
  signerRole?: string;
  signingOrder: number;
  contactId?: string;
  status?: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
}

interface SignerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  existingSigners?: Signer[];
  onSignersUpdate: () => void;
}

export function SignerSetupModal({
  isOpen,
  onClose,
  documentId,
  existingSigners = [],
  onSignersUpdate
}: SignerSetupModalProps) {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOrder, setSigningOrder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSigners(existingSigners.map(s => ({ ...s })));
      fetchContacts();
    }
  }, [isOpen, existingSigners]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    searchTerm === '' || 
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addSigner = (contact?: Contact) => {
    const newSigner: Signer = {
      signerEmail: contact?.email || '',
      signerName: contact ? `${contact.firstName} ${contact.lastName}` : '',
      signerRole: 'Customer',
      signingOrder: signers.length + 1,
      contactId: contact?.id,
    };

    setSigners([...signers, newSigner]);
    setSearchTerm('');
  };

  const updateSigner = (index: number, updates: Partial<Signer>) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], ...updates };
    setSigners(updated);
  };

  const removeSigner = (index: number) => {
    const updated = signers.filter((_, i) => i !== index);
    // Reorder remaining signers
    updated.forEach((signer, i) => {
      signer.signingOrder = i + 1;
    });
    setSigners(updated);
  };

  const moveSignerUp = (index: number) => {
    if (index === 0) return;
    const updated = [...signers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Update signing order
    updated.forEach((signer, i) => {
      signer.signingOrder = i + 1;
    });
    setSigners(updated);
  };

  const moveSignerDown = (index: number) => {
    if (index === signers.length - 1) return;
    const updated = [...signers];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Update signing order
    updated.forEach((signer, i) => {
      signer.signingOrder = i + 1;
    });
    setSigners(updated);
  };

  const validateSigners = () => {
    for (const signer of signers) {
      if (!signer.signerEmail || !signer.signerName) {
        return 'All signers must have name and email';
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signer.signerEmail)) {
        return 'All email addresses must be valid';
      }
    }

    // Check for duplicate emails
    const emails = signers.map(s => s.signerEmail.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      return 'Duplicate email addresses are not allowed';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateSigners();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (signers.length === 0) {
      toast.error('At least one signer is required');
      return;
    }

    setSaving(true);

    try {
      // Add new signers
      const newSigners = signers.filter(s => !s.id);
      
      for (const signer of newSigners) {
        const response = await fetch(`/api/esignature/documents/${documentId}/signers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signer),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add signer');
        }
      }

      // Update document signing order setting
      await fetch(`/api/esignature/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signingOrder,
        }),
      });

      toast.success('Signers updated successfully');
      onSignersUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving signers:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save signers');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Document Signers</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signing Order Setting */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Sequential Signing</h3>
                <p className="text-sm text-gray-600">
                  Require signers to sign in order (one at a time)
                </p>
              </div>
              <Switch
                checked={signingOrder}
                onCheckedChange={setSigningOrder}
              />
            </div>
          </Card>

          {/* Current Signers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Signers ({signers.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSigner()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Signer
              </Button>
            </div>

            {signers.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No signers yet</h3>
                <p className="text-gray-600 mb-4">
                  Add signers from your contacts or manually
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {signers.map((signer, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Order and Status */}
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                          {signer.signingOrder}
                        </Badge>
                        {signer.status && (
                          <SignerStatusBadge status={signer.status} />
                        )}
                      </div>

                      {/* Signer Details */}
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`signer-name-${index}`}>Full Name</Label>
                          <Input
                            id={`signer-name-${index}`}
                            value={signer.signerName}
                            onChange={(e) => updateSigner(index, { signerName: e.target.value })}
                            placeholder="Enter signer name"
                            disabled={!!signer.status && signer.status !== 'PENDING'}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`signer-email-${index}`}>Email Address</Label>
                          <Input
                            id={`signer-email-${index}`}
                            type="email"
                            value={signer.signerEmail}
                            onChange={(e) => updateSigner(index, { signerEmail: e.target.value })}
                            placeholder="Enter email address"
                            disabled={!!signer.status && signer.status !== 'PENDING'}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`signer-role-${index}`}>Role (Optional)</Label>
                          <Input
                            id={`signer-role-${index}`}
                            value={signer.signerRole || ''}
                            onChange={(e) => updateSigner(index, { signerRole: e.target.value })}
                            placeholder="e.g., Customer, Witness"
                            disabled={!!signer.status && signer.status !== 'PENDING'}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {signingOrder && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSignerUp(index)}
                              disabled={index === 0 || (!!signer.status && signer.status !== 'PENDING')}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSignerDown(index)}
                              disabled={index === signers.length - 1 || (!!signer.status && signer.status !== 'PENDING')}
                            >
                              <ArrowUpDown className="h-4 w-4 rotate-180" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSigner(index)}
                          disabled={!!signer.status && signer.status !== 'PENDING'}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Contact Search */}
          <div className="space-y-4">
            <h3 className="font-medium">Add from Contacts</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-600">
                    No contacts found matching "{searchTerm}"
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredContacts.slice(0, 10).map((contact) => {
                      const alreadyAdded = signers.some(s => s.contactId === contact.id);
                      
                      return (
                        <button
                          key={contact.id}
                          onClick={() => !alreadyAdded && addSigner(contact)}
                          disabled={alreadyAdded}
                          className={`w-full text-left p-3 rounded hover:bg-gray-50 transition-colors ${
                            alreadyAdded ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{contact.email}</p>
                            </div>
                            {alreadyAdded && (
                              <Badge variant="secondary">Added</Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || signers.length === 0}>
            {saving ? 'Saving...' : 'Save Signers'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
