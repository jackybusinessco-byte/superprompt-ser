import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const logPath = join(process.cwd(), 'stripe-emails.log')
    
    try {
      const logContent = await readFile(logPath, 'utf-8')
      const lines = logContent.trim().split('\n').filter(line => line)
      const emails = lines.map(line => JSON.parse(line))
      
      return NextResponse.json({
        success: true,
        message: `Found ${emails.length} logged emails`,
        emails: emails,
        count: emails.length
      })
      
    } catch (fileError) {
      return NextResponse.json({
        success: true,
        message: 'No emails logged yet',
        emails: [],
        count: 0
      })
    }
    
  } catch (error) {
    console.error('Error reading email log:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to read email log',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 