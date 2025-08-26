"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function PDFWorkerTest() {
  const [status, setStatus] = useState("Checking...")
  const [workerStatus, setWorkerStatus] = useState("Checking worker...")

  useEffect(() => {
    // Test if we can access the worker file
    fetch('/pdf.worker.min.js')
      .then(response => {
        if (response.ok) {
          setWorkerStatus("✅ Worker file accessible")
        } else {
          setWorkerStatus(`❌ Worker file error: ${response.status}`)
        }
      })
      .catch(error => {
        setWorkerStatus(`❌ Worker file fetch error: ${error.message}`)
      })

    // Test if we can load react-pdf
    import('react-pdf').then(() => {
      setStatus("✅ react-pdf loaded successfully")
    }).catch(error => {
      setStatus(`❌ react-pdf error: ${error.message}`)
    })
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">PDF Setup Status Check</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold">React PDF Status:</h3>
          <p>{status}</p>
        </div>

        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-semibold">Worker File Status:</h3>
          <p>{workerStatus}</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold">Next Steps:</h3>
          <p>If both checks pass, you can proceed to test the full PDF viewer at <Link href="/test-pdf-direct" className="text-blue-600 underline">/test-pdf-direct</Link></p>
        </div>
      </div>
    </div>
  )
}
