"use client""use client""use client""use client""use client"



import dynamic from 'next/dynamic'

import { FileText } from 'lucide-react'

import { cn } from '@/lib/utils'import dynamic from 'next/dynamic'

import { useEffect, useState } from 'react'

import { FileText } from 'lucide-react'

interface Signature {

  x: numberimport { cn } from '@/lib/utils'import dynamic from 'next/dynamic'

  y: number

  width: numberimport { useEffect, useState } from 'react'

  height: number

  page: numberimport { FileText } from 'lucide-react'

  id: string

}interface Signature {



interface PDFViewerWrapperProps {  x: numberimport { cn } from '@/lib/utils'import dynamic from 'next/dynamic'import dynamic from 'next/dynamic'

  fileUrl: string

  className?: string  y: number

  onSignatureAdd?: (signature: Signature) => void

  onSignatureRemove?: (signatureId: string) => void  width: numberimport { useEffect, useState } from 'react'

  signatures?: Signature[]

}  height: number



const PDFViewerComponent = dynamic(  page: numberimport { FileText } from 'lucide-react'import { FileText } from 'lucide-react'

  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),

  {  id: string

    ssr: false,

    loading: () => (}interface Signature {

      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

        <div className="text-center">

          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>

          <p className="text-gray-600">Loading PDF viewer...</p>interface PDFViewerWrapperProps {  x: numberimport { cn } from '@/lib/utils'import { cn } from '@/lib/utils'

        </div>

      </div>  fileUrl: string

    )

  }  className?: string  y: number

)

  onSignatureAdd?: (signature: Signature) => void

export function PDFViewerWrapper({ 

  fileUrl,   onSignatureRemove?: (signatureId: string) => void  width: numberimport { useEffect, useState } from 'react'import { useEffect, useState } from 'react'

  className,

  onSignatureAdd,  signatures?: Signature[]

  onSignatureRemove,

  signatures = [] }  height: number

}: PDFViewerWrapperProps) {

  const [signedUrl, setSignedUrl] = useState<string>('')



  useEffect(() => {// Dynamic import with no SSR to avoid PDF.js issues  page: number

    if (fileUrl && fileUrl.includes('94.249.71.89:9000/api/app/files/')) {

      const getSignedUrl = async () => {const PDFViewerComponent = dynamic(

        try {

          const sessionToken = localStorage.getItem('opensign_session_token')  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),  id: string

          if (!sessionToken) {

            setSignedUrl(fileUrl)  {

            return

          }    ssr: false,}interface Signature {interface Signature {



          const response = await fetch('http://94.249.71.89:9000/api/app/functions/getsignedurl', {    loading: () => (

            method: 'POST',

            headers: {      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

              'Accept': 'application/json, text/plain, */*',

              'Content-Type': 'Application/json',        <div className="text-center">

              'X-Parse-Application-Id': 'opensign',

              'X-Parse-Session-Token': sessionToken,          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>interface PDFViewerWrapperProps {  x: number  x: number

            },

            body: JSON.stringify({          <p className="text-gray-600">Loading PDF viewer...</p>

              url: fileUrl,

              docId: "",        </div>  fileUrl: string

              templateId: "templateID"

            })      </div>

          })

    )  className?: string  y: number  y: number

          if (response.ok) {

            const data = await response.json()  }

            setSignedUrl(data.result || fileUrl)

          } else {)  onSignatureAdd?: (signature: Signature) => void

            setSignedUrl(fileUrl)

          }

        } catch (error) {

          console.error('Error getting signed URL:', error)export function PDFViewerWrapper({   onSignatureRemove?: (signatureId: string) => void  width: number  width: number

          setSignedUrl(fileUrl)

        }  fileUrl, 

      }

  className,  signatures?: Signature[]

      getSignedUrl()

    } else {  onSignatureAdd,

      setSignedUrl(fileUrl)

    }  onSignatureRemove,}  height: number  height: number

  }, [fileUrl])

  signatures = [] 

  if (!fileUrl) {

    return (}: PDFViewerWrapperProps) {

      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>

        <div className="text-center">  const [proxyUrl, setProxyUrl] = useState<string>('')

          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />

          <p className="text-gray-600">No document selected</p>// Dynamic import with no SSR to avoid PDF.js issues  page: number  page: number

        </div>

      </div>  useEffect(() => {

    )

  }    // Check if this is an OpenSign file URL that needs proxyingconst PDFViewerComponent = dynamic(



  if (!signedUrl) {    if (fileUrl && fileUrl.includes('94.249.71.89:9000/api/app/files/')) {

    return (

      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">      // Get session token from localStorage  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),  id: string  id: string

        <div className="text-center">

          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>      const sessionToken = localStorage.getItem('opensign_session_token')

          <p className="text-gray-600">Preparing PDF...</p>

        </div>      if (sessionToken) {  {

      </div>

    )        // Use proxy endpoint with session token

  }

        const proxiedUrl = `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`    ssr: false,}}

  return (

    <div className={cn("w-full", className)}>        setProxyUrl(proxiedUrl)

      <PDFViewerComponent

        fileUrl={signedUrl}      } else {    loading: () => (

        signatures={signatures}

        onSignatureAdd={onSignatureAdd}        setProxyUrl(fileUrl) // Fallback to direct URL

        onSignatureRemove={onSignatureRemove}

      />      }      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

    </div>

  )    } else {

}
      setProxyUrl(fileUrl) // Use direct URL for non-OpenSign files        <div className="text-center">

    }

  }, [fileUrl])          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>interface PDFViewerWrapperProps {interface PDFViewerWrapperProps {



  if (!fileUrl) {          <p className="text-gray-600">Loading PDF viewer...</p>

    return (

      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>        </div>  fileUrl: string  fileUrl: string

        <div className="text-center">

          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />      </div>

          <p className="text-gray-600">No document selected</p>

        </div>    )  className?: string  className?: string

      </div>

    )  }

  }

)  onSignatureAdd?: (signature: Signature) => void  onSignatureAdd?: (signature: Signature) => void

  if (!proxyUrl) {

    return (

      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

        <div className="text-center">export function PDFViewerWrapper({   onSignatureRemove?: (signatureId: string) => void  onSignatureRemove?: (signatureId: string) => void

          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>

          <p className="text-gray-600">Preparing PDF...</p>  fileUrl, 

        </div>

      </div>  className,  signatures?: Signature[]  signatures?: Signature[]

    )

  }  onSignatureAdd,



  return (  onSignatureRemove,}}

    <div className={cn("w-full", className)}>

      <PDFViewerComponent  signatures = [] 

        fileUrl={proxyUrl}

        signatures={signatures}}: PDFViewerWrapperProps) {

        onSignatureAdd={onSignatureAdd}

        onSignatureRemove={onSignatureRemove}  const [proxyUrl, setProxyUrl] = useState<string>('')

      />

    </div>// Dynamic import with no SSR to avoid PDF.js issues// Dynamic import with no SSR to avoid PDF.js issues

  )

}  useEffect(() => {

    // Check if this is an OpenSign file URL that needs proxyingconst PDFViewerComponent = dynamic(const PDFViewerComponent = dynamic(

    if (fileUrl && fileUrl.includes('94.249.71.89:9000/api/app/files/')) {

      // Get session token from localStorage  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),

      const sessionToken = localStorage.getItem('opensign_session_token')

      if (sessionToken) {  {  {

        // Use proxy endpoint with session token

        const proxiedUrl = `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`    ssr: false,    ssr: false,

        setProxyUrl(proxiedUrl)

      } else {    loading: () => (    loading: () => (

        setProxyUrl(fileUrl) // Fallback to direct URL

      }      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

    } else {

      setProxyUrl(fileUrl) // Use direct URL for non-OpenSign files        <div className="text-center">        <div className="text-center">

    }

  }, [fileUrl])          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>



  if (!fileUrl) {          <p className="text-gray-600">Loading PDF viewer...</p>          <p className="text-gray-600">Loading PDF viewer...</p>

    return (

      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>        </div>        </div>

        <div className="text-center">

          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />      </div>      </div>

          <p className="text-gray-600">No document selected</p>

        </div>    )    )

      </div>

    )  }  }

  }

))

  if (!proxyUrl) {

    return (

      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

        <div className="text-center">export function PDFViewerWrapper({ export function PDFViewerWrapper({ 

          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>

          <p className="text-gray-600">Preparing PDF...</p>  fileUrl,   fileUrl, 

        </div>

      </div>  className,  className,

    )

  }  onSignatureAdd,  onSignatureAdd,



  return (  onSignatureRemove,  onSignatureRemove,

    <div className={cn("w-full", className)}>

      <PDFViewerComponent  signatures = []   signatures = [] 

        fileUrl={proxyUrl}

        signatures={signatures}}: PDFViewerWrapperProps) {}: PDFViewerWrapperProps) {

        onSignatureAdd={onSignatureAdd}

        onSignatureRemove={onSignatureRemove}  const [proxyUrl, setProxyUrl] = useState<string>('')  const [proxyUrl, setProxyUrl] = useState<string>('')

      />

    </div>

  )

}  useEffect(() => {  useEffect(() => {

    // Check if this is an OpenSign file URL that needs proxying    // Check if this is an OpenSign file URL that needs proxying

    if (fileUrl && fileUrl.includes('94.249.71.89:9000/api/app/files/')) {    if (fileUrl && fileUrl.includes('94.249.71.89:9000/api/app/files/')) {

      // Get session token from localStorage      // Get session token from localStorage

      const sessionToken = localStorage.getItem('opensign_session_token')      const sessionToken = localStorage.getItem('opensign_session_token')

      if (sessionToken) {      if (sessionToken) {

        // Use proxy endpoint with session token        // Use proxy endpoint with session token

        const proxiedUrl = `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`        const proxiedUrl = `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`

        setProxyUrl(proxiedUrl)        setProxyUrl(proxiedUrl)

      } else {      } else {

        setProxyUrl(fileUrl) // Fallback to direct URL        setProxyUrl(fileUrl) // Fallback to direct URL

      }      }

    } else {    } else {

      setProxyUrl(fileUrl) // Use direct URL for non-OpenSign files      setProxyUrl(fileUrl) // Use direct URL for non-OpenSign files

    }    }

  }, [fileUrl])  }, [fileUrl])



  if (!fileUrl) {  if (!fileUrl) {

    return (    return (

      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>

        <div className="text-center">        <div className="text-center">

          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />

          <p className="text-gray-600">No document selected</p>          <p className="text-gray-600">No document selected</p>

        </div>        </div>

      </div>      </div>

    )    )

  }  }



  if (!proxyUrl) {  if (!proxyUrl) {

    return (    return (

      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">

        <div className="text-center">        <div className="text-center">

          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>

          <p className="text-gray-600">Preparing PDF...</p>          <p className="text-gray-600">Preparing PDF...</p>

        </div>        </div>

      </div>      </div>

    )    )

  }  }



  return (  return (

    <div className={cn("w-full", className)}>    <div className={cn("w-full", className)}>

      <PDFViewerComponent      <PDFViewerComponent

        fileUrl={proxyUrl}        fileUrl={proxyUrl}

        signatures={signatures}        signatures={signatures}

        onSignatureAdd={onSignatureAdd}        onSignatureAdd={onSignatureAdd}

        onSignatureRemove={onSignatureRemove}        onSignatureRemove={onSignatureRemove}

      />      />

    </div>    </div>

  )  )

}}
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No document selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <PDFViewerComponent
        fileUrl={fileUrl}
        signatures={signatures}
        onSignatureAdd={onSignatureAdd}
        onSignatureRemove={onSignatureRemove}
      />
    </div>
  )
}
