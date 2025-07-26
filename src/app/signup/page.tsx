'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setResult({ message: 'Please fill in all fields', type: 'error' })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult({ message: `✅ ${data.message}`, type: 'success' })
        setEmail('')
        setPassword('')
      } else {
        if (data.message === 'Server configuration error') {
          setResult({ message: `❌ ${data.message} - Please check environment variables in deployment`, type: 'warning' })
        } else {
          setResult({ message: `❌ ${data.message}`, type: 'error' })
        }
      }
    } catch (error) {
      setResult({ message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            User Signup Test
          </h1>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
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
          
          <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            <strong>Note:</strong> This is a test page for the signup functionality. 
            If you encounter "Server configuration error", it means the Supabase environment variables 
            need to be configured in your deployment platform (Vercel, etc.).
          </div>
        </div>
      </div>
    </div>
  )
} 