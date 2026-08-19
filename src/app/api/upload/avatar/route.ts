/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient<any> | null = null
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const ext = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(fileName, file, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(fileName)

    const avatarUrl = publicUrlData.publicUrl

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ photo_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (dbError) {
      console.error('Profile update error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ avatarUrl, success: true })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
