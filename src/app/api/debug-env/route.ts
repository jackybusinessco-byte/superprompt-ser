import { NextResponse } from "next/server"

export async function GET() {
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "Not set"
  }
  
  return NextResponse.json(envVars)
}
