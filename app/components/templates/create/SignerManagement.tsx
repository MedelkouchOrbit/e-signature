'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Signer } from './types'

interface SignerManagementProps {
  sessionToken: string
  selectedSigners: Signer[]
  onSignerChange: (signers: Signer[]) => void
}

const SignerManagement: React.FC<SignerManagementProps> = ({
  sessionToken,
  selectedSigners,
  onSignerChange
}) => {
  const [availableSigners, setAvailableSigners] = useState<Signer[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingSigners, setIsLoadingSigners] = useState(false)

  // Fetch signers from API
  const fetchSigners = useCallback(async (search: string = '') => {
    setIsLoadingSigners(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/getsigners', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
        },
        body: JSON.stringify({ search })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSigners(data.result || [])
      } else {
        console.error('Failed to fetch signers')
      }
    } catch (error) {
      console.error('Error fetching signers:', error)
    } finally {
      setIsLoadingSigners(false)
    }
  }, [sessionToken])

  // Search signers when search term changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (sessionToken) {
        fetchSigners(searchTerm)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, sessionToken, fetchSigners])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.signer-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase()
    }
    return 'U' // Default fallback
  }

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
    return colors[index % colors.length]
  }

  const toggleSigner = (signer: Signer) => {
    const isSelected = selectedSigners.some(s => s.objectId === signer.objectId)
    if (isSelected) {
      onSignerChange(selectedSigners.filter(s => s.objectId !== signer.objectId))
    } else {
      onSignerChange([...selectedSigners, signer])
    }
  }

  const removeSigner = (signerId: string) => {
    onSignerChange(selectedSigners.filter(s => s.objectId !== signerId))
  }

  const reorderSigners = (startIndex: number, endIndex: number) => {
    const newSigners = Array.from(selectedSigners)
    const [removed] = newSigners.splice(startIndex, 1)
    newSigners.splice(endIndex, 0, removed)
    onSignerChange(newSigners)
  }

  const moveSignerUp = (index: number) => {
    if (index > 0) {
      reorderSigners(index, index - 1)
    }
  }

  const moveSignerDown = (index: number) => {
    if (index < selectedSigners.length - 1) {
      reorderSigners(index, index + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selected Signers */}
      {selectedSigners.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Selected Signers ({selectedSigners.length})</h3>
          <div className="space-y-2">
            {selectedSigners.map((signer, index) => (
              <div key={signer.objectId} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center flex-1 space-x-3">
                  <div className={`flex items-center justify-center w-8 h-8 text-white rounded-full text-sm font-medium ${getAvatarColor(index)}`}>
                    {getInitials(signer.Name, signer.Email)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{signer.Name || signer.Email}</p>
                    <p className="text-sm text-gray-500">{signer.Email}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Order: {index + 1}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveSignerUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSignerDown(index)}
                    disabled={index === selectedSigners.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSigner(signer.objectId)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Signers */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Add Signers</h3>
        <div className="relative signer-dropdown">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for signers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isLoadingSigners ? (
                <div className="p-4 text-center text-gray-500">Loading signers...</div>
              ) : availableSigners.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No signers found</div>
              ) : (
                availableSigners.map((signer, index) => {
                  const isSelected = selectedSigners.some(s => s.objectId === signer.objectId)
                  return (
                    <div
                      key={signer.objectId}
                      onClick={() => toggleSigner(signer)}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 text-white rounded-full text-sm font-medium ${getAvatarColor(index)}`}>
                        {getInitials(signer.Name, signer.Email)}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">{signer.Name || signer.Email}</p>
                        <p className="text-sm text-gray-500">{signer.Email}</p>
                      </div>
                      {isSelected && (
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignerManagement