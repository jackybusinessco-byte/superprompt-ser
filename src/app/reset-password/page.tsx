'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setResult({ message: 'Server configuration error', type: 'error' })
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        setResult({ message: 'Invalid or expired reset link. Please request a new password reset.', type: 'error' })
        return
      }

      if (session) {
        setIsValidSession(true)
        setUserEmail(session.user.email || '')
      } else {
        setResult({ message: 'Invalid or expired reset link. Please request a new password reset.', type: 'error' })
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setResult({ message: 'Please fill in all fields', type: 'error' })
      return
    }

    if (password !== confirmPassword) {
      setResult({ message: 'Passwords do not match', type: 'error' })
      return
    }

    if (password.length < 6) {
      setResult({ message: 'Password must be at least 6 characters long', type: 'error' })
      return
    }
    
    setLoading(true)
    
    try {
      // Call our API route to update the password
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: userEmail,
          password: password 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult({ message: data.message, type: 'success' })
        setPassword('')
        setConfirmPassword('')
        
        // Redirect to signup page after a short delay
        setTimeout(() => {
          window.location.href = '/signup'
        }, 3000)
      } else {
        setResult({ message: data.message, type: 'error' })
      }

    } catch (error) {
      console.error('Reset password error:', error)
      setResult({ message: 'An error occurred. Please try again.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Reset Password
            </h1>
            
            {result && (
              <div className={`p-4 rounded-md ${
                result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                result.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                result.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {result.message}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <a 
                href="/forgot-password" 
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Request New Reset Link
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Reset Password
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            Enter your new password below.
          </p>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your new password"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your new password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              result.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              result.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 