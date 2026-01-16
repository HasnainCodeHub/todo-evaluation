import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:5',message:'Middleware entry',data:{pathname:request.nextUrl.pathname,url:request.url,hasUrl:!!request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    const { pathname } = request.nextUrl
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:10',message:'Pathname extracted',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Public routes that don't require authentication
    const publicPaths = ['/', '/signin', '/signup']
    const isPublicPath = publicPaths.includes(pathname)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:16',message:'Public path check',data:{isPublicPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Get the session token from cookies
    // Check both regular and secure cookie names (production uses __Secure- prefix)
    const regularToken = request.cookies.get('better-auth.session_token')
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:22',message:'Cookie check - regular',data:{hasRegularToken:!!regularToken,allCookies:Object.keys(request.cookies.getAll()).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const secureToken = request.cookies.get('__Secure-better-auth.session_token')
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:26',message:'Cookie check - secure',data:{hasSecureToken:!!secureToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const sessionToken = regularToken || secureToken
    const hasSession = !!sessionToken
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:31',message:'Session status',data:{hasSession},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Redirect authenticated users away from auth pages to dashboard
    if (hasSession && (pathname === '/signin' || pathname === '/signup')) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:35',message:'Before redirect to dashboard',data:{requestUrl:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      try {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:40',message:'URL created for dashboard redirect',data:{redirectUrl:redirectUrl.toString(),origin:request.nextUrl.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return NextResponse.redirect(redirectUrl)
      } catch (urlError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:45',message:'URL creation error',data:{error:urlError.message,requestUrl:request.url,nextUrlOrigin:request.nextUrl.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw urlError
      }
    }

    // Redirect unauthenticated users to signin page
    if (!hasSession && !isPublicPath) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:53',message:'Before redirect to signin',data:{requestUrl:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      try {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/signin'
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:58',message:'URL created for signin redirect',data:{redirectUrl:redirectUrl.toString(),origin:request.nextUrl.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return NextResponse.redirect(redirectUrl)
      } catch (urlError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:63',message:'URL creation error for signin',data:{error:urlError.message,requestUrl:request.url,nextUrlOrigin:request.nextUrl.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw urlError
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:70',message:'Before NextResponse.next',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.next()
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1c5511c5-14ca-4576-be09-337fb4d9d70c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:75',message:'Middleware catch block',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200),errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('[Middleware] Error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
