
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    const { mobile, password } = await req.json()
    if (typeof mobile !== 'string' || typeof password !== 'string' || !password) {
      return jsonResponse({ error: 'Mobile number and password are required.' }, 400)
    }

    const digits = mobile.replace(/\D/g, '')
    if (!/^91[6-9]\d{9}$/.test(digits)) {
      return jsonResponse({ error: 'Enter a valid Indian mobile number.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    const secretKeys = JSON.parse(
      Deno.env.get('SUPABASE_SECRET_KEYS')!
    )
    
    const publishableKeys = JSON.parse(
      Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!
    )
    
    const serviceRoleKey = secretKeys['default']
    const anonKey = publishableKeys['default']

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const tenDigitMobile = digits.slice(2)
    const formattedMobile = `+${digits}`

    // Match either common storage format used by the student records.
    const { data: students, error: studentsError } = await admin
      .from('students')
      .select('id')
      .in('mobile', [formattedMobile, tenDigitMobile])

    if (studentsError) throw studentsError
    const studentIds = [...new Set((students ?? []).map((row) => row.id))]
    if (studentIds.length === 0) {
      return jsonResponse({ error: 'Invalid mobile number or password.' }, 401)
    }

    const { data: links, error: linksError } = await admin
      .from('student_parent_links')
      .select('parent_user_id')
      .in('student_id', studentIds)

    if (linksError) throw linksError
    const parentIds = [...new Set((links ?? []).map((row) => row.parent_user_id).filter(Boolean))]
    if (parentIds.length !== 1) {
      return jsonResponse({ error: 'This mobile number is not linked to one unique parent account. Please contact the administrator.' }, 401)
    }

    const parentId = parentIds[0]
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', parentId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile || profile.role !== 'parent') {
      return jsonResponse({ error: 'Invalid mobile number or password.' }, 401)
    }

    const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(parentId)
    if (authUserError) throw authUserError
    const email = authUserData.user?.email
    if (!email) {
      return jsonResponse({ error: 'This parent account has no email-based sign-in configured. Ask the administrator to update the account.' }, 400)
    }

    // The email remains server-side; only the resulting auth session is returned.
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.session) {
      return jsonResponse({ error: 'Invalid mobile number or password.' }, 401)
    }

    return jsonResponse({ session: signInData.session })
  } catch (error) {
    console.error('login-with-mobile error:', error)
    return jsonResponse({ error: 'Unable to complete mobile login. Please try again.' }, 500)
  }
})



