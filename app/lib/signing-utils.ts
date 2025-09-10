import { Document, DocumentSigner } from './documents-api-service'

/**
 * Enhanced utility functions for document signing with backend status tracking
 * Now supports real-time status updates and enhanced placeholder tracking
 */

/**
 * Get document status display information for UI with enhanced backend support
 */
export function getDocumentStatusDisplay(document: Document) {
  // Enhanced: Check both status field and IsCompleted from backend
  const isCompleted = document.status === 'signed';
  
  if (isCompleted) {
    return { 
      status: 'Completed', 
      color: 'green', 
      icon: '✅',
      description: 'All signers have completed signing',
      timestamp: document.updatedAt
    };
  }
  
  // Enhanced: Support for partially_signed status from backend
  if (document.status === 'partially_signed') {
    const signedCount = document.placeholders.filter(p => p.status === 'signed').length;
    const totalCount = document.placeholders.length;
    
    return {
      status: `Partially Signed (${signedCount}/${totalCount})`,
      color: 'blue',
      icon: '📝',
      description: `${signedCount} of ${totalCount} signers have completed signing`,
      progress: Math.round((signedCount / totalCount) * 100)
    };
  }
  
  switch (document.status) {
    case 'waiting':
      return { 
        status: 'Waiting for Signatures', 
        color: 'orange', 
        icon: '⏳',
        description: 'Document is awaiting signatures'
      };
    case 'signed':
      return { 
        status: 'Fully Signed', 
        color: 'green', 
        icon: '✅',
        description: 'Document has been fully signed by all parties',
        timestamp: document.updatedAt
      };
    case 'declined':
      return { 
        status: 'Declined', 
        color: 'red', 
        icon: '❌',
        description: 'Document was declined by a signer'
      };
    case 'expired':
      return { 
        status: 'Expired', 
        color: 'gray', 
        icon: '⌛',
        description: 'Document has passed its expiry date'
      };
    case 'drafted':
      return { 
        status: 'Draft', 
        color: 'blue', 
        icon: '📝',
        description: 'Document is in draft mode'
      };
    default:
      return { 
        status: 'Unknown', 
        color: 'gray', 
        icon: '❓',
        description: 'Document status is unknown'
      };
  }
}

/**
 * Check if user can sign a document (considering signing order)
 */
export function canUserSign(document: Document, userEmail: string): {
  canSign: boolean;
  reason?: string;
  waitingFor?: string;
} {
  // Find user in signers list
  const userSigner = document.signers.find(s => s.email === userEmail);
  
  if (!userSigner) {
    return { 
      canSign: false, 
      reason: 'You are not a signer on this document' 
    };
  }
  
  // Check if user already signed
  if (userSigner.status === 'signed') {
    return { 
      canSign: false, 
      reason: 'You have already signed this document' 
    };
  }
  
  // Check if document is completed
  const isCompleted = document.status === 'signed';
  
  if (isCompleted) {
    return { 
      canSign: false, 
      reason: 'This document has been completed' 
    };
  }
  
  // If sequential signing is not required, user can sign
  if (!document.sendInOrder) {
    return { canSign: true };
  }
  
  // Check sequential signing order
  const sortedSigners = [...document.signers].sort((a, b) => (a.order || 0) - (b.order || 0));
  const userIndex = sortedSigners.findIndex(s => s.email === userEmail);
  
  // Check if all previous signers have completed
  for (let i = 0; i < userIndex; i++) {
    if (sortedSigners[i].status !== 'signed') {
      return { 
        canSign: false, 
        reason: `Document must be signed in order. Waiting for ${sortedSigners[i].email} to sign first.`,
        waitingFor: sortedSigners[i].email
      };
    }
  }
  
  return { canSign: true };
}

/**
 * Get signing progress for sequential documents
 */
export function getSigningProgress(document: Document): {
  currentStep: number;
  totalSteps: number;
  nextSigner?: DocumentSigner;
  isSequential: boolean;
  steps: Array<{
    signer: DocumentSigner;
    isCompleted: boolean;
    isCurrent: boolean;
    isUpcoming: boolean;
  }>;
} {
  const isSequential = document.sendInOrder || false;
  const sortedSigners = isSequential 
    ? [...document.signers].sort((a, b) => (a.order || 0) - (b.order || 0))
    : document.signers;
  
  const completedSteps = sortedSigners.filter(s => s.status === 'signed').length;
  const totalSteps = sortedSigners.length;
  
  let nextSigner: DocumentSigner | undefined;
  const currentStepIndex = completedSteps;
  
  if (isSequential && currentStepIndex < totalSteps) {
    nextSigner = sortedSigners[currentStepIndex];
  }
  
  const steps = sortedSigners.map((signer, index) => ({
    signer,
    isCompleted: signer.status === 'signed',
    isCurrent: isSequential && index === currentStepIndex && signer.status !== 'signed',
    isUpcoming: isSequential && index > currentStepIndex
  }));
  
  return {
    currentStep: completedSteps + 1,
    totalSteps,
    nextSigner,
    isSequential,
    steps
  };
}

/**
 * Handle signing errors with user-friendly messages
 */
export function handleSigningError(error: unknown): {
  type: 'order' | 'authorization' | 'already_signed' | 'generic';
  title: string;
  message: string;
  actionable: boolean;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Signing Order Error')) {
    return {
      type: 'order',
      title: 'Signing Order Required',
      message: errorMessage.replace('Signing Order Error: ', ''),
      actionable: false
    };
  }
  
  if (errorMessage.includes('not authorized')) {
    return {
      type: 'authorization',
      title: 'Not Authorized',
      message: 'You are not authorized to sign this document. Please check that you are listed as a signer.',
      actionable: false
    };
  }
  
  if (errorMessage.includes('already signed')) {
    return {
      type: 'already_signed',
      title: 'Already Signed',
      message: 'You have already signed this document.',
      actionable: false
    };
  }
  
  return {
    type: 'generic',
    title: 'Signing Error',
    message: errorMessage || 'An unexpected error occurred while signing the document.',
    actionable: true
  };
}

/**
 * Format signing date for display
 */
export function formatSigningDate(signedAt?: string): string {
  if (!signedAt) return '';
  
  const date = new Date(signedAt);
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get completion message for fully signed documents
 */
export function getCompletionMessage(document: Document): string {
  const isCompleted = document.status === 'signed';
  if (!isCompleted) return '';
  
  const signerCount = document.signers.length;
  const documentName = document.name || 'Document';
  
  if (signerCount === 1) {
    return `✅ "${documentName}" has been signed!`;
  } else {
    return `✅ "${documentName}" has been fully signed by all ${signerCount} signers!`;
  }
}

/**
 * ✨ ENHANCED: Get detailed signing progress with backend status tracking
 */
export function getDetailedSigningProgress(document: Document) {
  const placeholders = document.placeholders || [];
  const signedPlaceholders = placeholders.filter(p => p.status === 'signed');
  const waitingPlaceholders = placeholders.filter(p => p.status === 'waiting');
  
  return {
    total: placeholders.length,
    signed: signedPlaceholders.length,
    waiting: waitingPlaceholders.length,
    progress: placeholders.length > 0 ? Math.round((signedPlaceholders.length / placeholders.length) * 100) : 0,
    isComplete: document.status === 'signed',
    isPartiallyComplete: document.status === 'partially_signed',
    signedTimestamps: signedPlaceholders
      .map(p => ({ email: p.email, signedAt: p.signedAt }))
      .filter(p => p.signedAt),
    nextSigners: waitingPlaceholders.map(p => p.email)
  };
}

/**
 * ✨ ENHANCED: Get audit trail information from enhanced backend data
 */
export function getSigningAuditTrail(document: Document) {
  const placeholders = document.placeholders || [];
  const signedPlaceholders = placeholders.filter(p => p.status === 'signed');
  
  return signedPlaceholders.map(placeholder => ({
    signerEmail: placeholder.email,
    signedAt: placeholder.signedAt || 'Unknown',
    ipAddress: placeholder.ipAddress || 'Unknown',
    signedUrl: placeholder.signedUrl,
    placeholderId: placeholder.id,
    timestamp: placeholder.signedAt ? new Date(placeholder.signedAt).toLocaleString() : 'Unknown'
  })).sort((a, b) => 
    new Date(a.signedAt).getTime() - new Date(b.signedAt).getTime()
  );
}

/**
 * ✨ ENHANCED: Check if sequential signing order is being followed
 */
export function validateSequentialSigningOrder(document: Document, currentUserEmail: string): {
  canSign: boolean;
  reason?: string;
  nextSigner?: string;
  order?: number;
} {
  if (!document.sendInOrder) {
    return { canSign: true };
  }
  
  const placeholders = document.placeholders || [];
  
  // Sort placeholders by order if available, otherwise by email
  const orderedPlaceholders = placeholders.sort((a, b) => {
    if (a.fields?.[0]?.page !== undefined && b.fields?.[0]?.page !== undefined) {
      return a.fields[0].page - b.fields[0].page;
    }
    return a.email.localeCompare(b.email);
  });
  
  // Find current user's placeholder
  const userPlaceholder = orderedPlaceholders.find(p => p.email === currentUserEmail);
  if (!userPlaceholder) {
    return { 
      canSign: false, 
      reason: 'You are not assigned as a signer for this document' 
    };
  }
  
  // Check if user has already signed
  if (userPlaceholder.status === 'signed') {
    return { 
      canSign: false, 
      reason: 'You have already signed this document' 
    };
  }
  
  // Find the first unsigned placeholder
  const nextUnsignedPlaceholder = orderedPlaceholders.find(p => p.status !== 'signed');
  
  if (!nextUnsignedPlaceholder) {
    return { 
      canSign: false, 
      reason: 'All placeholders have been signed' 
    };
  }
  
  // Check if current user is the next signer
  if (nextUnsignedPlaceholder.email === currentUserEmail) {
    const userIndex = orderedPlaceholders.indexOf(userPlaceholder);
    return { 
      canSign: true, 
      order: userIndex + 1 
    };
  } else {
    return { 
      canSign: false, 
      reason: `Document must be signed in order. Waiting for ${nextUnsignedPlaceholder.email} to sign first.`,
      nextSigner: nextUnsignedPlaceholder.email
    };
  }
}

/**
 * ✨ ENHANCED: Get real-time signing status summary for dashboard
 */
export function getSigningStatusSummary(document: Document) {
  const progress = getDetailedSigningProgress(document);
  const status = getDocumentStatusDisplay(document);
  
  return {
    documentId: document.objectId,
    documentName: document.name,
    status: document.status,
    statusDisplay: status,
    progress: progress,
    isUrgent: document.expiryDate ? new Date(document.expiryDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) : false, // Expires within 24 hours
    requiresAttention: document.status === 'waiting' && progress.waiting > 0,
    lastActivity: document.updatedAt,
    nextAction: progress.nextSigners.length > 0 ? `Waiting for ${progress.nextSigners[0]}` : 'Complete'
  };
}
