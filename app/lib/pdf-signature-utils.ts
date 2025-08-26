import { PDFDocument, rgb } from 'pdf-lib'

interface SignaturePosition {
  x: number
  y: number
  width: number
  height: number
  page: number
  id: string
}

export async function addSignaturesToPDF(
  originalPdfUrl: string,
  signatures: SignaturePosition[],
  signerName: string = 'Digital Signature'
): Promise<Blob> {
  try {
    // Fetch the original PDF
    const response = await fetch(originalPdfUrl)
    const arrayBuffer = await response.arrayBuffer()
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // Add signatures to each page
    for (const signature of signatures) {
      const page = pages[signature.page - 1] // Convert to 0-indexed
      if (!page) continue
      
      const { width: pageWidth, height: pageHeight } = page.getSize()
      
      // Calculate actual position (convert from percentage)
      const x = (signature.x / 100) * pageWidth
      const y = pageHeight - ((signature.y / 100) * pageHeight) - (signature.height / 100) * pageHeight
      const width = (signature.width / 100) * pageWidth
      const height = (signature.height / 100) * pageHeight
      
      // Draw signature box
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: rgb(0, 0.5, 1),
        borderWidth: 2,
        color: rgb(0.9, 0.95, 1),
        opacity: 0.8,
      })
      
      // Add signature text
      page.drawText(signerName, {
        x: x + 10,
        y: y + height / 2 - 5,
        size: Math.min(12, height / 3),
        color: rgb(0, 0.5, 1),
      })
      
      // Add timestamp
      const timestamp = new Date().toLocaleDateString()
      page.drawText(`Signed: ${timestamp}`, {
        x: x + 10,
        y: y + 5,
        size: Math.min(8, height / 4),
        color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    // Save the modified PDF
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
    
  } catch (error) {
    console.error('Error adding signatures to PDF:', error)
    throw new Error('Failed to add signatures to PDF')
  }
}

export async function uploadSignedPDF(
  signedPdfBlob: Blob,
  originalFileName: string
): Promise<string> {
  try {
    // Convert blob to base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data:application/pdf;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(signedPdfBlob)
    })
    
    // Generate signed filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const signedFileName = originalFileName.replace('.pdf', `_signed_${timestamp}.pdf`)
    
    // Upload to OpenSign via base64fileupload
    const response = await fetch('/api/proxy/opensign/functions/base64fileupload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: signedFileName,
        fileData: base64String
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload signed PDF')
    }
    
    const result = await response.json()
    return result.fileUrl || result.url
    
  } catch (error) {
    console.error('Error uploading signed PDF:', error)
    throw new Error('Failed to upload signed PDF')
  }
}
