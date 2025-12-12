'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

/**
 * OAuth callback page handler
 * 
 * This page handles the OAuth callback from the OAuth provider (e.g., NextChat).
 * It extracts the authorization code and state from the query parameters,
 * then redirects to the auth page with the appropriate provider parameter.
 * 
 * Following OAuth 2.0 best practices:
 * - Validates that a code is present
 * - Redirects to /auth with provider=GENERIC and the code
 * - Handles errors gracefully
 */
export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams?.get('code');
    const state = searchParams?.get('state');
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      router.push(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    // Validate that we have an authorization code
    if (!code) {
      console.error('OAuth callback missing authorization code');
      router.push('/auth/login?error=missing_code');
      return;
    }

    // Extract returnUrl from state if present
    // State format: {token}:{encodedState} or {encodedState}
    let returnUrl: string | null = null;
    if (state) {
      try {
        // Try to parse state as JSON first (for new format)
        const stateParts = state.split(':');
        if (stateParts.length > 1) {
          // Format: {token}:{encodedState}
          const encodedState = stateParts.slice(1).join(':'); // Handle multiple colons
          const decodedState = decodeURIComponent(encodedState);
          const stateData = JSON.parse(decodedState);
          if (stateData.returnUrl) {
            returnUrl = stateData.returnUrl;
          }
        } else {
          // Try direct JSON parse (fallback)
          const stateData = JSON.parse(decodeURIComponent(state));
          if (stateData.returnUrl) {
            returnUrl = stateData.returnUrl;
          }
        }
      } catch (e) {
        // State doesn't contain JSON, it's just a token (normal flow)
        // This is fine, we'll continue without returnUrl
      }
    }

    // Build redirect URL
    let redirectUrl = `/auth?provider=GENERIC&code=${encodeURIComponent(code)}`;
    if (state) {
      redirectUrl += `&state=${encodeURIComponent(state)}`;
    }
    if (returnUrl) {
      redirectUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
    }

    // Redirect to auth page with provider and code
    // The Register component will handle the OAuth flow from here
    router.push(redirectUrl);
  }, [router, searchParams]);

  // Show loading while processing the callback
  return <LoadingComponent />;
}
