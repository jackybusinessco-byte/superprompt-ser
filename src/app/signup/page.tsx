'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])

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
        setResult({ message: `❌ ${data.message}`, type: 'error' })
      }
    } catch (error) {
      setResult({ message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/signup', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
        setResult({ message: `✅ Loaded ${data.users?.length || 0} users`, type: 'success' })
      } else {
        setResult({ message: `❌ ${data.message}`, type: 'error' })
      }
    } catch (error) {
      setResult({ message: `❌ Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' })
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
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
              
              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Users'}
              </button>
            </div>
          </form>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              result.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {result.message}
            </div>
          )}
          
          {users.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Users in Database:</h3>
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                    <div className="text-sm">
                      <strong>Email:</strong> {user.email}<br />
                      <strong>Password:</strong> {user['Hashed Password']}<br />
                      <strong>Hashed Email:</strong> {user['Encrypted Email']}<br />
                      <strong>Pro User:</strong> {user.isPro ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 