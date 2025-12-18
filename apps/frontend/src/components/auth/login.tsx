'use client';

import Link from 'next/link';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import { OauthProvider } from '@gitroom/frontend/components/auth/providers/oauth.provider';
import { GoogleProvider } from '@gitroom/frontend/components/auth/providers/google.provider';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import WalletProvider from '@gitroom/frontend/components/auth/providers/wallet.provider';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export function Login() {
  const t = useT();
  const { isGeneral, neynarClientId, billingEnabled, genericOauth } =
    useVariables();
  
  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold text-start mb-4 cursor-pointer">
          {t('sign_in', 'Sign In')}
        </h1>
      </div>
      {isGeneral && genericOauth ? (
        <OauthProvider />
      ) : !isGeneral ? (
        <GithubProvider />
      ) : (
        <div className="gap-[5px] flex flex-col">
          <GoogleProvider />
          {!!neynarClientId && <FarcasterProvider />}
          {billingEnabled && <WalletProvider />}
        </div>
      )}
      {/* Email/password login is disabled - only OAuth is allowed */}
      <div className="text-center mt-6">
        <p className="mt-4 text-sm">
          {t('don_t_have_an_account', "Don't Have An Account?")}&nbsp;
          <Link href="/auth" className="underline cursor-pointer">
            {t('sign_up', 'Sign Up')}
          </Link>
        </p>
      </div>
    </div>
  );
}
