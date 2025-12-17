'use client';

import { FC, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';

export const YouTubeInsertComponent: FC<{
  editor: any;
}> = ({ editor }) => {
  const t = useT();
  const modal = useModals();
  const [url, setUrl] = useState('');

  const handleInsert = () => {
    if (!url.trim()) {
      return;
    }

    editor?.commands?.setYouTube({
      src: url.trim(),
    });

    modal.closeAll();
    setUrl('');
  };

  const handleClick = () => {
    modal.openModal({
      title: t('insert_youtube_video', 'Insert YouTube Video'),
      children: (
        <div className="flex flex-col gap-4 p-4">
          <Input
            label={t('youtube_url', 'YouTube URL')}
            placeholder="https://www.youtube.com/watch?v=..."
            name="youtubeUrl"
            disableForm={true}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button
              secondary
              onClick={() => {
                modal.closeAll();
                setUrl('');
              }}
            >
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={handleInsert} disabled={!url.trim()}>
              {t('insert', 'Insert')}
            </Button>
          </div>
        </div>
      ),
    });
  };

  return (
    <div
      className="select-none cursor-pointer w-[40px] p-[5px] text-center"
      onClick={handleClick}
      title={t('insert_youtube_video', 'Insert YouTube Video')}
    >
      📺
    </div>
  );
};
