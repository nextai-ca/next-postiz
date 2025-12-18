'use client';

import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import clsx from 'clsx';
import { GoogleProvider } from '@gitroom/frontend/components/auth/providers/google.provider';
import { OauthProvider } from '@gitroom/frontend/components/auth/providers/oauth.provider';
import { useFireEvents } from '@gitroom/helpers/utils/use.fire.events';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useTrack } from '@gitroom/react/helpers/use.track';
import { TrackEnum } from '@gitroom/nestjs-libraries/user/track.enum';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import dynamic from 'next/dynamic';
import { WalletUiProvider } from '@gitroom/frontend/components/auth/providers/placeholder/wallet.ui.provider';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
const WalletProvider = dynamic(
  () => import('@gitroom/frontend/components/auth/providers/wallet.provider'),
  {
    ssr: false,
    loading: () => <WalletUiProvider />,
  }
);
export function Register() {
  const getQuery = useSearchParams();
  const fetch = useFetch();
  const [provider] = useState(getQuery?.get('provider')?.toUpperCase());
  const [code, setCode] = useState(getQuery?.get('code') || '');
  const [returnUrl, setReturnUrl] = useState(getQuery?.get('returnUrl') || null);
  const [show, setShow] = useState(false);
  const load = useCallback(async () => {
    if (!provider || !code) return;
    const { token } = await (
      await fetch(`/auth/oauth/${provider?.toUpperCase() || 'LOCAL'}/exists`, {
        method: 'POST',
        body: JSON.stringify({
          code,
        }),
      })
    ).json();
    if (token) {
      setCode(token);
      setShow(true);
    }
  }, [provider, code, fetch]);
  
  useEffect(() => {
    if (provider && code) {
      load();
    }
  }, [provider, code, load]);
  
  if (!code && !provider) {
    return <RegisterAfter token="" provider="LOCAL" returnUrl={returnUrl} />;
  }
  if (!show) {
    return <LoadingComponent />;
  }
  return (
    <RegisterAfter token={code} provider={provider?.toUpperCase() || 'LOCAL'} returnUrl={returnUrl} />
  );
}
function getHelpfulReasonForRegistrationFailure(httpCode: number) {
  switch (httpCode) {
    case 400:
      return 'Email already exists';
    case 404:
      return 'Your browser got a 404 when trying to contact the API, the most likely reasons for this are the NEXT_PUBLIC_BACKEND_URL is set incorrectly, or the backend is not running.';
  }
  return 'Unhandled error: ' + httpCode;
}
export function RegisterAfter({
  token,
  provider,
  returnUrl,
}: {
  token: string;
  provider: string;
  returnUrl?: string | null;
}) {
  const t = useT();
  const { isGeneral, genericOauth, neynarClientId, billingEnabled } =
    useVariables();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fireEvents = useFireEvents();
  const track = useTrack();
  const fetchData = useFetch();
  
  const handleAutoRegister = useCallback(async () => {
    if (!token || !provider || provider === 'LOCAL') return;
    
    setLoading(true);
    try {
      const response = await fetchData('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          providerToken: token,
          provider: provider,
          company: '', // Use empty string as default company
        }),
      });

      if (response.status === 200) {
        fireEvents('register');
        await track(TrackEnum.CompleteRegistration);
        if (response.headers.get('activate') === 'true') {
          router.push('/auth/activate');
        } else {
          // Redirect to returnUrl if provided, otherwise to login
          if (returnUrl && returnUrl.startsWith('http')) {
            window.location.href = returnUrl;
          } else {
            router.push('/auth/login');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Registration failed:', errorText);
        // If user already exists, redirect to login
        if (errorText.includes('already exists') || errorText.includes('Email already')) {
          router.push('/auth/login');
        }
      }
    } catch (e) {
      console.error('Registration error:', e);
    } finally {
      setLoading(false);
    }
  }, [token, provider, returnUrl, router, fireEvents, track, fetchData]);

  // Auto-register when OAuth token is available
  useEffect(() => {
    if (token && provider && provider !== 'LOCAL') {
      handleAutoRegister();
    }
  }, [token, provider, handleAutoRegister]);

  // Show only OAuth buttons - no forms
  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold text-start mb-4 cursor-pointer">
          {t('sign_up', 'Sign Up')}
        </h1>
      </div>
      {!isGeneral ? (
        <GithubProvider />
      ) : (
        <div className="gap-[5px] flex flex-col">
          {genericOauth && isGeneral ? (
            <OauthProvider />
          ) : (
            <GoogleProvider />
          )}
          {!!neynarClientId && <FarcasterProvider />}
          {billingEnabled && <WalletProvider />}
        </div>
      )}
      {loading && (
        <div className="text-center mt-6">
          <p>{t('processing', 'Processing...')}</p>
        </div>
      )}
      <div className="text-center mt-6">
        <p className="mt-4 text-sm">
          {t('already_have_an_account', 'Already Have An Account?')}&nbsp;
          <Link href="/auth/login" className="underline cursor-pointer">
            {t('sign_in', 'Sign In')}
          </Link>
        </p>
      </div>
      <div className={clsx('text-[12px] mt-4 text-center')}>
        {t(
          'by_registering_you_agree_to_our',
          'By registering you agree to our'
        )}&nbsp;
        <a
          href={`https://postiz.com/terms`}
          className="underline hover:font-bold"
          rel="nofollow"
        >
          {t('terms_of_service', 'Terms of Service')}
        </a>&nbsp;
        {t('and', 'and')}&nbsp;
        <a
          href={`https://postiz.com/privacy`}
          rel="nofollow"
          className="underline hover:font-bold"
        >
          {t('privacy_policy', 'Privacy Policy')}
        </a>
      </div>
    </div>
  );
}
