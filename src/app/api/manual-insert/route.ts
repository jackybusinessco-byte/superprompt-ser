import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    console.log('📧 Manual insert request for:', email)
    
    // For now, just return success and log the email
    // The actual insertion will be handled by you in Supabase dashboard
    console.log(`✅ Email to be inserted: ${email} with isPro: true`)
    
    // You can manually run this SQL in your Supabase dashboard:
    const sqlCommand = `INSERT INTO "Users" (email, "isPro") VALUES ('${email}', true) ON CONFLICT (email) DO UPDATE SET "isPro" = true;`
    
    console.log('🔧 SQL Command to run:', sqlCommand)

    return NextResponse.json({ 
      success: true, 
      message: `Email captured: ${email}`,
      sqlCommand: sqlCommand,
      instructions: 'Run the SQL command in your Supabase dashboard SQL editor'
    })

  } catch (error) {
    console.error('❌ Manual insert error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Manual insert failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 