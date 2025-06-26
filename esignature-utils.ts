
'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import SHA256 from 'crypto-js/sha256';

export interface SignatureFieldData {
  id: string;
  type: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX';
  pageNumber: number;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  required: boolean;
  signerId?: string;
  value?: string;
  signatureType?: string;
}

export interface DocumentMetadata {
  title: string;
  totalPages: number;
  fileSize: number;
  createdAt: Date;
  documentHash: string;
}

/**
 * Calculate SHA-256 hash of document content for integrity verification
 */
export function calculateDocumentHash(content: string | Buffer): string {
  const hash = SHA256(content.toString());
  return hash.toString();
}

/**
 * Calculate hash of signature data for verification
 */
export function calculateSignatureHash(signatureData: string): string {
  const hash = SHA256(signatureData);
  return hash.toString();
}

/**
 * Validate signature field coordinates
 */
export function validateFieldCoordinates(field: Partial<SignatureFieldData>): boolean {
  if (!field.x || !field.y || !field.width || !field.height) return false;
  
  // Ensure coordinates are within bounds (0-100%)
  if (field.x < 0 || field.x > 100) return false;
  if (field.y < 0 || field.y > 100) return false;
  if (field.width <= 0 || field.width > 100) return false;
  if (field.height <= 0 || field.height > 100) return false;
  
  // Ensure field doesn't exceed page bounds
  if (field.x + field.width > 100) return false;
  if (field.y + field.height > 100) return false;
  
  return true;
}

/**
 * Generate unique signing token
 */
export function generateSigningToken(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const combined = `${timestamp}-${random}`;
  return SHA256(combined).toString().substring(0, 32);
}

/**
 * Embed signatures into PDF document
 */
export async function embedSignaturesInPDF(
  pdfBytes: Uint8Array,
  signatures: SignatureFieldData[]
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Group signatures by page
    const signaturesByPage = signatures.reduce((acc, sig) => {
      if (!acc[sig.pageNumber]) acc[sig.pageNumber] = [];
      acc[sig.pageNumber].push(sig);
      return acc;
    }, {} as Record<number, SignatureFieldData[]>);
    
    for (const [pageNumStr, pageSignatures] of Object.entries(signaturesByPage)) {
      const pageNum = parseInt(pageNumStr) - 1; // Convert to 0-based index
      if (pageNum < 0 || pageNum >= pages.length) continue;
      
      const page = pages[pageNum];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      for (const signature of pageSignatures) {
        if (!signature.value) continue;
        
        // Calculate absolute coordinates from percentages
        const x = (signature.x / 100) * pageWidth;
        const y = pageHeight - ((signature.y / 100) * pageHeight) - ((signature.height / 100) * pageHeight);
        const width = (signature.width / 100) * pageWidth;
        const height = (signature.height / 100) * pageHeight;
        
        if (signature.type === 'SIGNATURE' || signature.type === 'INITIALS') {
          // Handle image signatures
          if (signature.value.startsWith('data:image/')) {
            try {
              const imageBytes = dataURLToBytes(signature.value);
              const image = signature.value.includes('png') 
                ? await pdfDoc.embedPng(imageBytes)
                : await pdfDoc.embedJpg(imageBytes);
              
              page.drawImage(image, {
                x,
                y,
                width,
                height,
              });
            } catch (error) {
              console.error('Error embedding signature image:', error);
              // Fallback to text
              const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
              page.drawText('[SIGNATURE]', {
                x,
                y: y + height / 2,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
            }
          }
        } else if (signature.type === 'TEXT' || signature.type === 'DATE') {
          // Handle text fields
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const fontSize = Math.min(height * 0.6, 12); // Scale font to field height
          
          page.drawText(signature.value, {
            x,
            y: y + height / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: width,
          });
        } else if (signature.type === 'CHECKBOX') {
          // Handle checkboxes
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const checkSize = Math.min(width, height) * 0.8;
          
          // Draw checkbox border
          page.drawRectangle({
            x,
            y,
            width: checkSize,
            height: checkSize,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          
          // Draw checkmark if checked
          if (signature.value === 'checked') {
            page.drawText('✓', {
              x: x + checkSize * 0.1,
              y: y + checkSize * 0.1,
              size: checkSize * 0.8,
              font,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
    }
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error embedding signatures in PDF:', error);
    throw new Error('Failed to embed signatures in PDF');
  }
}

/**
 * Convert data URL to byte array
 */
function dataURLToBytes(dataURL: string): Uint8Array {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Extract metadata from PDF document
 */
export async function extractPDFMetadata(pdfBytes: Uint8Array): Promise<DocumentMetadata> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const documentHash = calculateDocumentHash(Buffer.from(pdfBytes));
    
    return {
      title: pdfDoc.getTitle() || 'Untitled Document',
      totalPages: pageCount,
      fileSize: pdfBytes.length,
      createdAt: new Date(),
      documentHash
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'File must be a PDF' };
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB' };
  }
  
  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { isValid: false, error: 'File must have .pdf extension' };
  }
  
  return { isValid: true };
}

/**
 * Check if all required fields are signed
 */
export function areAllRequiredFieldsSigned(
  fields: SignatureFieldData[],
  signerId?: string
): boolean {
  const requiredFields = fields.filter(field => 
    field.required && (!signerId || field.signerId === signerId)
  );
  
  return requiredFields.every(field => field.value && field.value.trim() !== '');
}

/**
 * Get next required field for signing
 */
export function getNextRequiredField(
  fields: SignatureFieldData[],
  signerId?: string
): SignatureFieldData | null {
  const requiredFields = fields.filter(field => 
    field.required && 
    (!signerId || field.signerId === signerId) &&
    (!field.value || field.value.trim() === '')
  );
  
  // Sort by page number and position
  requiredFields.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    return a.y - b.y; // Top to bottom
  });
  
  return requiredFields[0] || null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate access code for additional security
 */
export function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get field type display name
 */
export function getFieldTypeDisplayName(type: string): string {
  switch (type) {
    case 'SIGNATURE':
      return 'Signature';
    case 'INITIALS':
      return 'Initials';
    case 'DATE':
      return 'Date';
    case 'TEXT':
      return 'Text Field';
    case 'CHECKBOX':
      return 'Checkbox';
    default:
      return type;
  }
}
