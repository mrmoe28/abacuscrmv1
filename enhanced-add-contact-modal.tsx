
"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Tag,
  ChevronRight,
  ChevronLeft,
  Home,
  Zap,
  DollarSign,
  FileText,
  Check,
  X,
  Camera,
  Globe,
  Sun,
  Calculator,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAddContactModalProps {
  children?: React.ReactNode;
  onContactCreated?: () => void;
}

interface ContactFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  type: string;
  source: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Solar-Specific Information
  propertyType: string;
  homeOwnership: string;
  roofType: string;
  roofAge: string;
  currentUtilityProvider: string;
  averageMonthlyBill: string;
  solarInterestLevel: string;
  motivationFactors: string[];
  hasElectricVehicle: boolean;
  plannedElectricVehicle: boolean;
  timeframe: string;
  budgetRange: string;
  financingPreference: string;
  
  // Additional Information
  notes: string;
  tags: string[];
  referredBy: string;
  leadScore: string;
  communicationPreference: string;
}

const contactTypes = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
];

const contactSources = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'TRADE_SHOW', label: 'Trade Show' },
];

const propertyTypes = [
  { value: 'SINGLE_FAMILY', label: 'Single Family Home' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'CONDO', label: 'Condominium' },
  { value: 'COMMERCIAL', label: 'Commercial Building' },
  { value: 'INDUSTRIAL', label: 'Industrial Facility' },
  { value: 'OTHER', label: 'Other' },
];

const roofTypes = [
  { value: 'ASPHALT_SHINGLE', label: 'Asphalt Shingle' },
  { value: 'METAL', label: 'Metal' },
  { value: 'TILE', label: 'Tile' },
  { value: 'SLATE', label: 'Slate' },
  { value: 'FLAT', label: 'Flat' },
  { value: 'OTHER', label: 'Other' },
];

const motivationFactors = [
  'Environmental Impact',
  'Cost Savings',
  'Energy Independence',
  'Property Value Increase',
  'Tax Incentives',
  'Backup Power',
  'Modern Technology',
  'Community Benefits'
];

const predefinedTags = [
  'High Priority', 'Solar Interest', 'Commercial', 'Residential', 
  'Hot Lead', 'Follow Up', 'Qualified', 'Budget Approved',
  'Site Survey Needed', 'Price Sensitive', 'Quick Decision',
  'Referral Source', 'Environmentally Motivated', 'Tech Savvy'
];

const steps = [
  { id: 1, title: 'Basic Info', description: 'Contact details', icon: User },
  { id: 2, title: 'Location', description: 'Address & property', icon: MapPin },
  { id: 3, title: 'Solar Profile', description: 'Energy & preferences', icon: Sun },
  { id: 4, title: 'Motivation', description: 'Goals & timeline', icon: Calendar },
  { id: 5, title: 'Summary', description: 'Review & create', icon: Check },
];

export function EnhancedAddContactModal({ children, onContactCreated }: EnhancedAddContactModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentTag, setCurrentTag] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    type: 'LEAD',
    source: 'WEBSITE',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    homeOwnership: '',
    roofType: '',
    roofAge: '',
    currentUtilityProvider: '',
    averageMonthlyBill: '',
    solarInterestLevel: '',
    motivationFactors: [],
    hasElectricVehicle: false,
    plannedElectricVehicle: false,
    timeframe: '',
    budgetRange: '',
    financingPreference: '',
    notes: '',
    tags: [],
    referredBy: '',
    leadScore: '',
    communicationPreference: 'EMAIL',
  });

  const handleInputChange = (field: keyof ContactFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMotivationFactorToggle = (factor: string) => {
    setFormData(prev => ({
      ...prev,
      motivationFactors: prev.motivationFactors.includes(factor)
        ? prev.motivationFactors.filter(f => f !== factor)
        : [...prev.motivationFactors, factor]
    }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setCurrentTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      type: 'LEAD',
      source: 'WEBSITE',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: '',
      homeOwnership: '',
      roofType: '',
      roofAge: '',
      currentUtilityProvider: '',
      averageMonthlyBill: '',
      solarInterestLevel: '',
      motivationFactors: [],
      hasElectricVehicle: false,
      plannedElectricVehicle: false,
      timeframe: '',
      budgetRange: '',
      financingPreference: '',
      notes: '',
      tags: [],
      referredBy: '',
      leadScore: '',
      communicationPreference: 'EMAIL',
    });
    setCurrentStep(1);
    setCurrentTag('');
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName.trim() && formData.lastName.trim();
      case 2:
        return true; // Address is optional
      case 3:
        return true; // Solar info is optional
      case 4:
        return true; // Motivation is optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          company: formData.company.trim() || undefined,
          title: formData.title.trim() || undefined,
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
          notes: [
            formData.notes,
            // Add solar-specific info to notes
            formData.propertyType && `Property Type: ${formData.propertyType}`,
            formData.roofType && `Roof Type: ${formData.roofType}`,
            formData.currentUtilityProvider && `Utility Provider: ${formData.currentUtilityProvider}`,
            formData.averageMonthlyBill && `Monthly Bill: $${formData.averageMonthlyBill}`,
            formData.solarInterestLevel && `Interest Level: ${formData.solarInterestLevel}`,
            formData.motivationFactors.length > 0 && `Motivations: ${formData.motivationFactors.join(', ')}`,
            formData.timeframe && `Timeframe: ${formData.timeframe}`,
            formData.budgetRange && `Budget: ${formData.budgetRange}`,
            formData.hasElectricVehicle && `Has Electric Vehicle: Yes`,
            formData.plannedElectricVehicle && `Plans Electric Vehicle: Yes`,
          ].filter(Boolean).join('\n'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contact');
      }

      toast({
        title: "Success",
        description: "Contact created successfully!",
      });

      setOpen(false);
      resetForm();
      
      if (onContactCreated) {
        onContactCreated();
      }

    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getProgress = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Solar Solutions Inc."
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Homeowner"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contact Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NY"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="10001"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeOwnership">Home Ownership</Label>
                <Select value={formData.homeOwnership} onValueChange={(value) => handleInputChange('homeOwnership', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWN">Own</SelectItem>
                    <SelectItem value="RENT">Rent</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roofType">Roof Type</Label>
                <Select value={formData.roofType} onValueChange={(value) => handleInputChange('roofType', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roofTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roofAge">Roof Age (years)</Label>
                <Input
                  id="roofAge"
                  type="number"
                  value={formData.roofAge}
                  onChange={(e) => handleInputChange('roofAge', e.target.value)}
                  placeholder="10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentUtilityProvider">Utility Provider</Label>
                <Input
                  id="currentUtilityProvider"
                  value={formData.currentUtilityProvider}
                  onChange={(e) => handleInputChange('currentUtilityProvider', e.target.value)}
                  placeholder="ConEd, PG&E, etc."
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageMonthlyBill">Average Monthly Bill ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="averageMonthlyBill"
                    type="number"
                    value={formData.averageMonthlyBill}
                    onChange={(e) => handleInputChange('averageMonthlyBill', e.target.value)}
                    placeholder="150"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="solarInterestLevel">Solar Interest Level</Label>
              <Select value={formData.solarInterestLevel} onValueChange={(value) => handleInputChange('solarInterestLevel', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interest level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Just exploring</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Somewhat interested</SelectItem>
                  <SelectItem value="HIGH">High - Very interested</SelectItem>
                  <SelectItem value="URGENT">Urgent - Ready to move forward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasElectricVehicle"
                  checked={formData.hasElectricVehicle}
                  onCheckedChange={(checked) => handleInputChange('hasElectricVehicle', checked)}
                  disabled={loading}
                />
                <Label htmlFor="hasElectricVehicle">Has Electric Vehicle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="plannedElectricVehicle"
                  checked={formData.plannedElectricVehicle}
                  onCheckedChange={(checked) => handleInputChange('plannedElectricVehicle', checked)}
                  disabled={loading}
                />
                <Label htmlFor="plannedElectricVehicle">Plans to Buy EV</Label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Motivation Factors</Label>
              <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2">
                {motivationFactors.map((factor) => (
                  <Badge
                    key={factor}
                    variant={formData.motivationFactors.includes(factor) ? "default" : "outline"}
                    className="cursor-pointer justify-start p-2 h-auto"
                    onClick={() => handleMotivationFactorToggle(factor)}
                  >
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeframe">Installation Timeframe</Label>
                <Select value={formData.timeframe} onValueChange={(value) => handleInputChange('timeframe', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASAP">ASAP - Within 1 month</SelectItem>
                    <SelectItem value="3_MONTHS">Within 3 months</SelectItem>
                    <SelectItem value="6_MONTHS">Within 6 months</SelectItem>
                    <SelectItem value="1_YEAR">Within 1 year</SelectItem>
                    <SelectItem value="RESEARCH">Just researching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Select value={formData.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_10K">Under $10,000</SelectItem>
                    <SelectItem value="10K_25K">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25K_50K">$25,000 - $50,000</SelectItem>
                    <SelectItem value="OVER_50K">Over $50,000</SelectItem>
                    <SelectItem value="UNKNOWN">Not sure yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financingPreference">Financing Preference</Label>
              <Select value={formData.financingPreference} onValueChange={(value) => handleInputChange('financingPreference', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select financing preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash purchase</SelectItem>
                  <SelectItem value="LOAN">Solar loan</SelectItem>
                  <SelectItem value="LEASE">Solar lease</SelectItem>
                  <SelectItem value="PPA">Power Purchase Agreement (PPA)</SelectItem>
                  <SelectItem value="UNSURE">Not sure yet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referredBy">Referred By</Label>
              <Input
                id="referredBy"
                value={formData.referredBy}
                onChange={(e) => handleInputChange('referredBy', e.target.value)}
                placeholder="Friend, family member, or other source"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationPreference">Communication Preference</Label>
              <Select value={formData.communicationPreference} onValueChange={(value) => handleInputChange('communicationPreference', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="TEXT">Text/SMS</SelectItem>
                  <SelectItem value="ANY">Any method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Review Contact Information</h3>
              <p className="text-sm text-muted-foreground">Please review the information before creating the contact</p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</div>
                  <div><span className="text-muted-foreground">Type:</span> {formData.type}</div>
                  {formData.email && <div><span className="text-muted-foreground">Email:</span> {formData.email}</div>}
                  {formData.phone && <div><span className="text-muted-foreground">Phone:</span> {formData.phone}</div>}
                  {formData.company && <div><span className="text-muted-foreground">Company:</span> {formData.company}</div>}
                  <div><span className="text-muted-foreground">Source:</span> {formData.source}</div>
                </div>
              </div>

              {(formData.address || formData.city || formData.propertyType) && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Property Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {formData.address && <div><span className="text-muted-foreground">Address:</span> {formData.address}</div>}
                    {formData.city && <div><span className="text-muted-foreground">City:</span> {formData.city}, {formData.state}</div>}
                    {formData.propertyType && <div><span className="text-muted-foreground">Property:</span> {formData.propertyType}</div>}
                    {formData.roofType && <div><span className="text-muted-foreground">Roof:</span> {formData.roofType}</div>}
                  </div>
                </div>
              )}

              {(formData.solarInterestLevel || formData.averageMonthlyBill || formData.motivationFactors.length > 0) && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Solar Profile
                  </h4>
                  <div className="space-y-2 text-sm">
                    {formData.solarInterestLevel && <div><span className="text-muted-foreground">Interest Level:</span> {formData.solarInterestLevel}</div>}
                    {formData.averageMonthlyBill && <div><span className="text-muted-foreground">Monthly Bill:</span> ${formData.averageMonthlyBill}</div>}
                    {formData.timeframe && <div><span className="text-muted-foreground">Timeframe:</span> {formData.timeframe}</div>}
                    {formData.budgetRange && <div><span className="text-muted-foreground">Budget:</span> {formData.budgetRange}</div>}
                    {formData.motivationFactors.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Motivations:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.motivationFactors.map((factor) => (
                            <Badge key={factor} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(currentTag.trim());
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddTag(currentTag.trim())}
                    disabled={loading || !currentTag.trim()}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {predefinedTags.slice(0, 6).map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tag)}
                      disabled={loading || formData.tags.includes(tag)}
                      className="h-8 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes about this contact..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="bg-orange-gradient">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Add New Contact
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive contact profile with solar-specific information
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(getProgress())}% complete</span>
          </div>
          <Progress value={getProgress()} className="w-full" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between py-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center mt-2">
                  <div className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={loading || !validateStep(currentStep)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contact
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
