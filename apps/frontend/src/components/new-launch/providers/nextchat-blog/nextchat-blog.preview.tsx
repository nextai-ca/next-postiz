'use client';

import { FC, useState } from 'react';
import { useIntegration } from '@gitroom/frontend/components/launches/helpers/use.integration';
import { useFormContext } from 'react-hook-form';
import { useMediaDirectory } from '@gitroom/react/helpers/use.media.directory';
import clsx from 'clsx';
import Image from 'next/image';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type ViewMode = 'list' | 'detail';

export const NextChatBlogPreview: FC<{
  maximumCharacters?: number;
}> = () => {
  const { value: topValue, integration } = useIntegration();
  const mediaDir = useMediaDirectory();
  const { watch } = useFormContext();
  const t = useT();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Watch form values directly (flat structure: title, main_image, etc.)
  const title = watch('title') as string | undefined;
  const mainImage = watch('main_image') as { path: string } | undefined;
  const featuredImage = watch('featuredImage') as string | undefined;

  const [firstPost] = topValue;
  const coverImage = mainImage?.path || featuredImage;
  const displayTitle = title || 'Untitled';
  const content = firstPost?.content || '';

  // Strip HTML tags for content preview in list view
  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') {
      // Server-side: simple regex-based stripping
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const plainContent = content ? stripHtml(content) : '';

  if (!content && !displayTitle) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center text-newTextItemBlur">
        Start writing your post for a preview
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* View Mode Toggle */}
      <div className="flex gap-[4px] mb-[20px] p-[4px] border border-newTableBorder rounded-[8px]">
        <div
          onClick={() => setViewMode('list')}
          className={clsx(
            'cursor-pointer rounded-[4px] flex-1 overflow-hidden whitespace-nowrap text-center pt-[6px] pb-[5px]',
            viewMode === 'list'
              ? 'text-textItemFocused bg-boxFocused'
              : 'text-newTextItemBlur'
          )}
        >
          {t('list_view', 'List View')}
        </div>
        <div
          onClick={() => setViewMode('detail')}
          className={clsx(
            'cursor-pointer rounded-[4px] flex-1 overflow-hidden whitespace-nowrap text-center pt-[6px] pb-[5px]',
            viewMode === 'detail'
              ? 'text-textItemFocused bg-boxFocused'
              : 'text-newTextItemBlur'
          )}
        >
          {t('detail_view', 'Detail View')}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-newBgColorInner rounded-lg shadow-lg overflow-hidden border border-newTableBorder">
          {/* Cover Image */}
          {coverImage && (
            <div className="w-full h-48 bg-newBgLineColor relative overflow-hidden">
              <img
                src={mediaDir.set(coverImage)}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            {displayTitle && (
              <h2 className="text-xl font-bold mb-2 text-textColor line-clamp-2">
                {displayTitle}
              </h2>
            )}

            {/* Content - Show only 2 lines */}
            {plainContent && (
              <div 
                className="text-newTextItemBlur text-sm"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.5',
                  maxHeight: '3em', // 2 lines * 1.5 line-height
                }}
              >
                {plainContent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail View */}
      {viewMode === 'detail' && (
        <div className="bg-newBgColorInner rounded-lg shadow-lg overflow-hidden border border-newTableBorder">
          {/* Content - No cover image */}
          <div className="p-6">
            {/* Title */}
            {displayTitle && (
              <h1 className="text-3xl font-bold mb-4 text-textColor">{displayTitle}</h1>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-newTableBorder">
              <img
                src={integration?.picture || '/no-picture.jpg'}
                alt={integration?.name || 'Author'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-textColor">
                  {integration?.name || 'Author'}
                </div>
                {integration?.display && (
                  <div className="text-xs text-newTextItemBlur">
                    @{integration.display}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            {content && (
              <div
                className="prose prose-lg max-w-none text-textColor"
                style={{
                  // Ensure images and iframes are responsive
                  color: 'rgb(var(--new-textColor))',
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
