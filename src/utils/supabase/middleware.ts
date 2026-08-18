import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require specific permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/users': 'users.view',
  '/marketplaces': 'marketplaces.view',
  '/settings': 'settings.view',
  '/reports': 'reports.view',
  '/import-export': 'exports.use',
  '/pricing': 'products.view',
}

// Routes that require ADMIN only
const ADMIN_ONLY_ROUTES = ['/users']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not logged in → redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/access-denied')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in → redirect root to dashboard
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Permission check for protected routes (server components also check, this is defense in depth)
  if (user) {
    const pathname = request.nextUrl.pathname

    // Check admin-only routes
    for (const adminRoute of ADMIN_ONLY_ROUTES) {
      if (pathname.startsWith(adminRoute)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'ADMIN' || profile.status !== 'ACTIVE') {
          const url = request.nextUrl.clone()
          url.pathname = '/access-denied'
          return NextResponse.redirect(url)
        }
      }
    }

    // Check permission-based routes
    for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single()

        if (!profile || profile.status !== 'ACTIVE') {
          const url = request.nextUrl.clone()
          url.pathname = '/access-denied'
          return NextResponse.redirect(url)
        }

        // ADMIN always passes
        if (profile.role !== 'ADMIN') {
          // Check role_permissions
          const { data: rolePerm } = await supabase
            .from('role_permissions')
            .select('permission_code')
            .eq('role', profile.role)
            .eq('permission_code', permission)
            .maybeSingle()

          if (!rolePerm) {
            // Check user override
            const { data: userPerm } = await supabase
              .from('user_permissions')
              .select('granted')
              .eq('user_id', user.id)
              .eq('permission_code', permission)
              .maybeSingle()

            if (!userPerm || !userPerm.granted) {
              const url = request.nextUrl.clone()
              url.pathname = '/access-denied'
              return NextResponse.redirect(url)
            }
          }
        }
      }
    }
  }

  return supabaseResponse
}
