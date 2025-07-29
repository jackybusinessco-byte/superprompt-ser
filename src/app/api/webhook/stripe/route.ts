import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { appendFile } from 'fs/promises'
import { join } from 'path'
import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})


// Helper function to log email to file as backup
async function logEmailToFile(email: string, eventType: string) {
  try {
    const logEntry = {
      email,
      eventType,
      timestamp: new Date().toISOString(),
      isPro: true
    }
    
    const logPath = join(process.cwd(), 'stripe-emails.log')
    await appendFile(logPath, JSON.stringify(logEntry) + '\n')
    console.log('📝 Email logged to file:', email)
  } catch (error) {
    console.error('Failed to log email to file:', error)
  }
}

// Helper function to save via direct API call
async function saveViaMCP(email: string) {
  try {
    console.log('🔧 Attempting direct MCP insertion for:', email)
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/direct-insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, isPro: true })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ MCP insertion successful:', result)
      return result.data
    } else {
      throw new Error(result.error || 'MCP insertion failed')
    }
  } catch (error) {
    console.error('❌ MCP insertion failed:', error)
    throw error
  }
}

// Helper function to extract email from Stripe event
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractEmailFromEvent(event: { type: string; data: { object: any } }): Promise<string | null> {
  const { type, data } = event
  
  // Try to get email from different event types
  switch (type) {
    case 'payment_intent.succeeded':
    case 'payment_intent.created':
      // Check if there's a customer and get their email
      if (data.object.customer) {
        console.log('Found customer ID:', data.object.customer)
        // Note: In a real app, you'd need to fetch customer details from Stripe API
        // For now, check if receipt_email is available
        return data.object.receipt_email || null
      }
      return data.object.receipt_email || null
      
    case 'charge.succeeded':
    case 'charge.updated':
      return data.object.billing_details?.email || data.object.receipt_email || null
      
    case 'checkout.session.completed':
      return data.object.customer_details?.email || null
      
    case 'invoice.payment_succeeded':
      // Handle invoice payments
      return data.object.customer_email || null
      
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      // Handle subscription events - fetch customer email from Stripe API
      const customerId = data.object.customer
      console.log('🔍 Subscription event - customer ID:', customerId)
      
      if (customerId) {
        try {
          console.log('🔍 Fetching customer details from Stripe...')
          const customer = await stripe.customers.retrieve(customerId)
          
          // Check if customer is not deleted and has email
          if (!customer.deleted && customer.email) {
            console.log('✅ Found customer email:', customer.email)
            return customer.email
          } else {
            console.log('⚠️ Customer is deleted or has no email')
            return null
          }
        } catch (error) {
          console.error('❌ Failed to fetch customer from Stripe:', error)
          // Fallback to trying metadata if Stripe fetch fails
          return data.object.metadata?.email || null
        }
      }
      
      // Fallback if no customer ID
      return data.object.customer_email || 
             data.object.metadata?.email ||
             null
      
    default:
      console.log('🔍 Attempting to extract email from unknown event type:', type)
      // Try common email fields
      return data.object?.receipt_email || 
             data.object?.customer_email || 
             data.object?.billing_details?.email || 
             data.object?.customer_details?.email || 
             data.object?.metadata?.email ||
             null
  }
}

// Helper function to cancel user subscription in Supabase
async function cancelUserSubscription(email: string, eventType: string) {
  try {
    console.log('🚫 Attempting to cancel subscription for email:', email)
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email)
      return null
    }
    
    // Update user to set isPro to false
    const { data, error } = await supabase
      .from('Users')
      .update({ isPro: false })
      .eq('email', email)
      .select()
        
    if (error) {
      console.error('❌ Failed to cancel subscription in Supabase:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        code: error.code
      })
      
      // Log to file as backup
      console.log('💾 Saving cancellation to file as backup...')
      await logEmailToFile(email, eventType + '_cancellation')
      
      throw error
    } else {
      console.log('✅ Subscription cancelled in Supabase:', data)
      return data
    }
  } catch (error) {
    console.error('❌ Error cancelling subscription in Supabase:', error)
    
    // Always try to log to file as backup
    try {
      await logEmailToFile(email, eventType + '_cancellation')
    } catch (fileError) {
      console.error('Failed to save cancellation to backup file:', fileError)
    }
    
    throw error
  }
}

// Helper function to save user email to Supabase
async function saveUserToSupabase(email: string, eventType: string) {
  try {
    console.log('💾 Attempting to save email to Supabase:', email)
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email)
      return null
    }
    
    // Try to insert or update user in Supabase
    const { data, error } = await supabase
      .from('Users')
      .insert({
        email: email,
        isPro: true // Set to pro since they made a payment
      })
      .select()
      .maybeSingle()
    
    // If insert fails due to duplicate, try update
    if (error && error.code === '23505') {
      console.log('🔄 Email exists, updating instead...')
      const { data: updateData, error: updateError } = await supabase
        .from('Users')
        .update({ isPro: true })
        .eq('email', email)
        .select()
        
      if (updateError) {
        throw updateError
      }
      
      return updateData
    }

    if (error) {
      console.error('❌ Failed to save user to Supabase:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        code: error.code
      })
      
      // Try MCP approach as fallback
      console.log('🔧 Trying MCP direct insertion...')
      try {
        const mcpResult = await saveViaMCP(email)
        console.log('✅ MCP insertion successful')
        return mcpResult
      } catch (mcpError) {
        console.error('❌ MCP insertion also failed:', mcpError)
        
        // If all else fails, log to file as backup
        console.log('💾 Saving to file as final backup...')
        await logEmailToFile(email, eventType)
        
        throw error
      }
    } else {
      console.log('✅ User saved to Supabase:', data)
      return data
    }
  } catch (error) {
    console.error('❌ Error saving user to Supabase:', error)
    
    // Always try to log to file as backup
    try {
      await logEmailToFile(email, eventType)
    } catch (fileError) {
      console.error('Failed to save to backup file:', fileError)
    }
    
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Log the webhook event for debugging
    console.log('Received Stripe webhook:', {
      signature: signature.substring(0, 20) + '...',
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    })

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_SIGNING_SECRET!
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Log the full event data for debugging
    console.log('📨 Webhook event:', {
      type: event.type,
      id: event.id,
      data: event.data?.object ? {
        id: (event.data.object as any).id,
        amount: (event.data.object as any).amount,
        currency: (event.data.object as any).currency,
        receipt_email: (event.data.object as any).receipt_email,
        customer: (event.data.object as any).customer,
        billing_details: (event.data.object as any).billing_details
      } : 'No object data'
    })

    // Extract email from the event
    const email = await extractEmailFromEvent(event)
    
    // Log extracted email for debugging
    if (email) {
      console.log('📧 Extracted email:', email)
    } else {
      console.log('❌ No email extracted from event type:', event.type)
    }
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ PaymentIntent succeeded:', (event.data.object as any).id)
        if (email) {
          try {
            await saveUserToSupabase(email, event.type)
          } catch {
            console.log('⚠️ All storage methods failed but email logged to file')
          }
        } else {
          console.warn('⚠️ No email found in payment_intent.succeeded event')
        }
        break
        
      case 'payment_intent.created':
        console.log('📝 PaymentIntent created:', (event.data.object as any).id)
        if (email) {
          console.log('📧 Email found on payment creation:', email)
        }
        break
        
      case 'charge.succeeded':
        console.log('💳 Charge succeeded:', (event.data.object as any).id)
        if (email) {
          try {
            await saveUserToSupabase(email, event.type)
          } catch {
            console.log('⚠️ All storage methods failed but email logged to file')
          }
        } else {
          console.warn('⚠️ No email found in charge.succeeded event')
        }
        break
        
      case 'charge.updated':
        console.log('🔄 Charge updated:', (event.data.object as any).id)
        break
        
      case 'checkout.session.completed':
        console.log('🛒 Checkout session completed:', (event.data.object as any).id)
        if (email) {
          try {
            await saveUserToSupabase(email, event.type)
          } catch {
            console.log('⚠️ All storage methods failed but email logged to file')
          }
        } else {
          console.warn('⚠️ No email found in checkout.session.completed event')
        }
        break
        
      case 'invoice.payment_succeeded':
        console.log('🧾 Invoice payment succeeded:', (event.data.object as any).id)
        if (email) {
          try {
            await saveUserToSupabase(email, event.type)
          } catch {
            console.log('⚠️ All storage methods failed but email logged to file')
          }
        } else {
          console.warn('⚠️ No email found in invoice.payment_succeeded event')
        }
        break
        
      case 'customer.subscription.deleted':
        console.log('🚫 Subscription cancelled:', (event.data.object as any).id)
        if (email) {
          try {
            await cancelUserSubscription(email, event.type)
            console.log('✅ User subscription cancelled successfully')
          } catch {
            console.log('⚠️ Failed to cancel subscription but logged to file')
          }
        } else {
          console.warn('⚠️ No email found in customer.subscription.deleted event')
          console.log('🔍 Customer ID:', (event.data.object as any).customer)
          console.log('🔍 Full subscription object:', JSON.stringify(event.data.object, null, 2))
        }
        break
        
      default:
        console.log('📨 Unhandled event type:', event.type)
        // Still try to extract and save email if available
        if (email) {
          console.log('🔍 Found email in unhandled event, attempting to save:', email)
          try {
            await saveUserToSupabase(email, event.type)
          } catch {
            console.log('⚠️ All storage methods failed but email logged to file')
          }
        }
    }

    // Return success response
    return NextResponse.json({ 
      received: true, 
      event_type: event.type,
      email_extracted: !!email 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Always return 200 to prevent Stripe from retrying
    // This prevents the 500 errors from accumulating
    return NextResponse.json({ 
      received: true, 
      error: 'Webhook processed with errors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 })
  }
} 