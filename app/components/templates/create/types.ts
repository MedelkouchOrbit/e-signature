// Template creation type definitions
export interface CreateTemplateFormData {
  name: string
  description: string
  fileUrl: string | null
  sendInOrder: boolean
  otpEnabled: boolean
}

export interface FieldPlacement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
  placeholder?: string
  assignedSigner?: string
  signatureData?: string  // Optional property for backwards compatibility with backup files
}

export interface PlaceholderPage {
  pageNumber: number
  pos: FieldPosition[]
}

export interface FieldPosition {
  xPosition: number
  yPosition: number
  isStamp: boolean
  key: number
  scale: number
  zIndex: number
  type: string
  options: {
    name: string
    status: string
  }
  Width: number
  Height: number
}

export interface SignerPlaceholder {
  signerPtr: {
    __type: string
    className: string
    objectId: string
  }
  signerObjId: string
  blockColor: string
  Role: string
  Id: number
  placeHolder: PlaceholderPage[]
}

export interface Signer {
  objectId: string
  Name: string
  Email: string
  UserRole?: string
  TenantId?: {
    __type: string
    className: string
    objectId: string
  }
  CreatedBy?: {
    __type: string
    className: string
    objectId: string
  }
  UserId?: {
    __type: string
    className: string
    objectId: string
  }
  IsDeleted?: boolean
}

export interface DocumentDetails {
  objectId: string
  Name: string
  URL: string
  SignedUrl: string
  Description: string
  Note: string
  Placeholders: SignerPlaceholder[]
  Signers: Signer[]
  SendinOrder: boolean
  AutomaticReminders: boolean
  RemindOnceInEvery: number
  IsEnableOTP: boolean
  IsTourEnabled: boolean
  AllowModifications: boolean
  TimeToCompleteDays: number
  SignatureType: Array<{ name: string; enabled: boolean }>
  NotifyOnSignatures: boolean
  createdAt: string
  updatedAt: string
}

export type SigningMode = 'sign_yourself' | 'add_signers'
export type SignatureType = 'draw' | 'type' | 'upload'

// Signature Canvas Props Interface
export interface SignatureCanvasProps {
  ref?: React.RefObject<SignatureCanvasRef | null>
  penColor?: string
  canvasProps?: {
    width: number
    height: number
    className: string
  }
}

export interface SignatureCanvasRef {
  clear: () => void
  toDataURL: () => string
  isEmpty: () => boolean
  getCanvas: () => HTMLCanvasElement
}