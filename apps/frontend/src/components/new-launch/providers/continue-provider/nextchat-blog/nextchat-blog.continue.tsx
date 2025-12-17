'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';

export const NextChatBlogContinue: FC<{
  onSave: (data: any) => Promise<void>;
  existingId: string[];
}> = (props) => {
  const { onSave, existingId } = props;
  const call = useCustomProviderFunction();
  const [botConfig, setSelectedBotConfig] = useState<null | { botConfigId: string }>(null);
  const t = useT();

  const loadBots = useCallback(async () => {
    try {
      const bots = await call.get('getBots');
      return bots;
    } catch (e) {
      console.error('Failed to load bots:', e);
      return [];
    }
  }, [call]);

  const setBotConfig = useCallback(
    (param: { botConfigId: string }) => () => {
      setSelectedBotConfig(param);
    },
    []
  );

  const { data, isLoading } = useSWR('load-nextchat-bots', loadBots, {
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  const saveBotConfig = useCallback(async () => {
    if (!botConfig) return;
    await onSave(botConfig);
  }, [onSave, botConfig]);

  const filteredData = useMemo(() => {
    return (
      data?.filter(
        (p: { botConfigId: string }) => !existingId.includes(p.botConfigId)
      ) || []
    );
  }, [data, existingId]);

  if (isLoading) {
    return (
      <div className="text-center flex flex-col justify-center items-center text-[18px] leading-[26px] h-[300px]">
        {t('loading', 'Loading...')}
      </div>
    );
  }

  if (!isLoading && !data?.length) {
    return (
      <div className="text-center flex flex-col justify-center items-center text-[18px] leading-[26px] h-[300px]">
        {t(
          'nextchat_no_blogs_found',
          "We couldn't find any blogs in your NextChat account."
        )}
        <br />
        <br />
        {t(
          'nextchat_ensure_blog_exists',
          'Please ensure you have a blog created in your NextChat bot configuration.'
        )}
        <br />
        <br />
        {t(
          'nextchat_try_again',
          'Please close this dialog, delete the integration and try again.'
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div>
        {t('select_blog', 'Select NextChat Blog:')}
      </div>
      <div className="grid grid-cols-3 justify-items-center select-none cursor-pointer gap-[10px]">
        {filteredData?.map(
          (p: {
            botConfigId: string;
            name: string;
            websiteUrl: string | null;
            hasBlog: boolean;
            blogId: string;
          }) => (
            <div
              key={p.botConfigId}
              className={clsx(
                'flex flex-col w-full text-center gap-[10px] border border-input p-[10px] hover:bg-seventh rounded-[8px]',
                botConfig?.botConfigId === p.botConfigId &&
                  'bg-seventh border-primary'
              )}
              onClick={setBotConfig({ botConfigId: p.botConfigId })}
            >
              <div className="flex justify-center">
                <div className="w-[80px] h-[80px] bg-input rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium">{p.name || 'Unnamed Bot'}</div>
              {p.websiteUrl && (
                <div className="text-xs text-gray-500 truncate w-full">
                  {p.websiteUrl}
                </div>
              )}
              {p.hasBlog && (
                <div className="text-xs text-gray-400">Has Blog</div>
              )}
            </div>
          )
        )}
      </div>
      <div>
        <Button disabled={!botConfig} onClick={saveBotConfig}>
          {t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};
