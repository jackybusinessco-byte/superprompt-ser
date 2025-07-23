import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

interface User {
  email: string
  isPro: boolean
}

interface SyncResult {
  email: string
  oldStatus: boolean
  newStatus: boolean
  hasActiveSubscription: boolean
  error?: string
}

async function checkUserSubscriptionStatus(email: string): Promise<{ hasActiveSubscription: boolean; error?: string }> {
  try {
    console.log(`🔍 Checking subscription status for: ${email}`)
    
    // Find customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })
    
    if (customers.data.length === 0) {
      console.log(`ℹ️ No Stripe customer found for: ${email}`)
      return { hasActiveSubscription: false }
    }
    
    const customer = customers.data[0]
    console.log(`👤 Found customer: ${customer.id} for ${email}`)
    
    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })
    
    const hasActiveSubscription = subscriptions.data.length > 0
    console.log(`📊 ${email} has ${subscriptions.data.length} active subscriptions`)
    
    return { hasActiveSubscription }
    
  } catch (error) {
    console.error(`❌ Error checking ${email}:`, error)
    return { 
      hasActiveSubscription: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

async function updateUserSubscriptionStatus(email: string, isPro: boolean): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('Users')
      .update({ isPro })
      .eq('email', email)
      .select()
    
    if (error) {
      console.error(`❌ Failed to update ${email}:`, error)
      return false
    }
    
    console.log(`✅ Updated ${email} to isPro: ${isPro}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error updating ${email}:`, error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting subscription sync process...')
    const startTime = Date.now()
    
    // Check for auth header to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('🚫 Unauthorized sync attempt')
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Get all users from Supabase
    const { data: users, error: fetchError } = await supabase
      .from('Users')
      .select('email, isPro')
    
    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users from database'
      }, { status: 500 })
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in database')
      return NextResponse.json({
        success: true,
        message: 'No users to sync',
        results: []
      })
    }
    
    console.log(`📊 Found ${users.length} users to sync`)
    
    const results: SyncResult[] = []
    let updatedCount = 0
    let errorCount = 0
    
    // Process users in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (user: User) => {
        const result: SyncResult = {
          email: user.email,
          oldStatus: user.isPro,
          newStatus: user.isPro,
          hasActiveSubscription: false
        }
        
        try {
          // Check current subscription status in Stripe
          const { hasActiveSubscription, error } = await checkUserSubscriptionStatus(user.email)
          result.hasActiveSubscription = hasActiveSubscription
          result.error = error
          
          // Update if status changed
          if (hasActiveSubscription !== user.isPro) {
            const updated = await updateUserSubscriptionStatus(user.email, hasActiveSubscription)
            if (updated) {
              result.newStatus = hasActiveSubscription
              updatedCount++
              console.log(`🔄 ${user.email}: ${user.isPro} → ${hasActiveSubscription}`)
            } else {
              result.error = 'Failed to update database'
              errorCount++
            }
          } else {
            console.log(`✓ ${user.email}: Status unchanged (${user.isPro})`)
          }
          
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error)
          errorCount++
          console.error(`❌ Sync error for ${user.email}:`, error)
        }
        
        results.push(result)
      }))
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const duration = Date.now() - startTime
    const summary = {
      success: true,
      message: 'Subscription sync completed',
      stats: {
        totalUsers: users.length,
        updatedUsers: updatedCount,
        errorCount: errorCount,
        durationMs: duration
      },
      results: results.filter(r => r.oldStatus !== r.newStatus || r.error) // Only show changed/error users
    }
    
    console.log(`🎉 Sync completed: ${updatedCount} updated, ${errorCount} errors, ${duration}ms`)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Subscription sync failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Subscription sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for manual triggering
  return GET(request)
} 