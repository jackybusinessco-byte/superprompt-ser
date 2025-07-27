import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/password-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if Supabase environment variables are configured
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Attempting to update password for email:', email)

    // Hash the new password
    const hashedPassword = await hashPassword(password)
    console.log('Password hashed successfully')

    // First, update the password in the custom Users table
    console.log('Updating password in Users table...')
    const { error: dbError } = await supabase
      .from('Users')
      .update({ password: hashedPassword })
      .eq('email', email)

    if (dbError) {
      console.error('Error updating password in Users table:', dbError)
      return NextResponse.json(
        { success: false, message: 'Failed to update password in database' },
        { status: 500 }
      )
    }

    console.log('Password updated successfully in Users table')

    // Now update the password in Supabase Auth
    console.log('Updating password in Supabase Auth...')
    
    // Get the user from Supabase Auth by email
    const { data: users, error: findError } = await supabase.auth.admin.listUsers()
    
    if (findError) {
      console.error('Error finding user in Supabase Auth:', findError)
      // Don't fail the request since we already updated the Users table
      console.log('Continuing without Supabase Auth update...')
    } else {
      const user = users.users.find(u => u.email === email)
      
      if (user) {
        // Update the user's password using admin API
        const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
          password: password
        })

        if (authError) {
          console.error('Error updating password in Supabase Auth:', authError)
          // Don't fail the request since we already updated the Users table
          console.log('Supabase Auth update failed, but Users table was updated')
        } else {
          console.log('Password updated successfully in Supabase Auth')
        }
      } else {
        console.log('User not found in Supabase Auth, but Users table was updated')
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password updated successfully! You can now sign in with your new password.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 