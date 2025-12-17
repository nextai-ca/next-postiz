'use client';

import { FC, useEffect } from 'react';
import {
  PostComment,
  withProvider,
} from '@gitroom/frontend/components/new-launch/providers/high.order.provider';
import { useSettings } from '@gitroom/frontend/components/launches/helpers/use.values';
import { Input } from '@gitroom/react/form/input';
import { NextChatBlogDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/nextchat-blog.dto';
import { MediaComponent } from '@gitroom/frontend/components/media/media.component';
import { NextChatBlogPreview } from '@gitroom/frontend/components/new-launch/providers/nextchat-blog/nextchat-blog.preview';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';
import { useIntegration } from '@gitroom/frontend/components/launches/helpers/use.integration';
import { useWatch } from 'react-hook-form';
import useSWR from 'swr';
import { useCallback } from 'react';

const NextChatBlogSettings: FC = () => {
  const form = useSettings();
  const { integration } = useIntegration();
  const call = useCustomProviderFunction();
  // botConfigId is stored as internalId in the integration
  const botConfigId = integration?.internalId || '';

  const loadTags = useCallback(async () => {
    if (!botConfigId) return [];
    try {
      const tags = await call.get('getTags', { botConfigId });
      return tags;
    } catch (e) {
      return [];
    }
  }, [botConfigId, call]);

  const { data: tags } = useSWR(
    botConfigId ? `nextchat-blog-tags-${botConfigId}` : null,
    loadTags,
    {
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  // Set botConfigId in settings if not already set
  const currentBotConfigId = useWatch({
    name: 'botConfigId',
  }) as string;

  // Use useEffect to ensure botConfigId is set when integration is available
  useEffect(() => {
    if (botConfigId && !currentBotConfigId) {
      form.setValue('botConfigId', botConfigId, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [botConfigId, currentBotConfigId, form]);

  return (
    <>
      <Input label="Title" {...form.register('title')} required />
      <MediaComponent
        label="Cover Photo (Optional)"
        description="Add an optional cover photo for your blog post"
        {...form.register('main_image')}
      />
      {tags && tags.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: { _id: string; name: string }) => (
              <label
                key={tag._id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={tag.name}
                  {...form.register('tagIds')}
                  className="rounded"
                />
                <span className="text-sm">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default withProvider({
  postComment: PostComment.COMMENT,
  minimumCharacters: [],
  SettingsComponent: NextChatBlogSettings,
  CustomPreviewComponent: NextChatBlogPreview,
  dto: NextChatBlogDto,
  checkValidity: undefined,
  maximumCharacters: 100000,
});
