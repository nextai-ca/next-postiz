'use client';

import { FC, useRef, useState } from 'react';
import { useUppyUploader } from '@gitroom/frontend/components/media/new.uploader';
import { useMediaDirectory } from '@gitroom/react/helpers/use.media.directory';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { Button } from '@gitroom/react/form/button';

export const ImageInsertComponent: FC<{
  editor: any;
}> = ({ editor }) => {
  const t = useT();
  const mediaDir = useMediaDirectory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uppy = useUppyUploader({
    onUploadSuccess: (result: any) => {
      if (result && result.length > 0) {
        const imageUrl = mediaDir.set(result[0].path);
        editor?.commands?.setImage({
          src: imageUrl,
          alt: result[0].name || 'Image',
        });
      }
      setUploading(false);
      uppy.clear();
    },
    allowedFileTypes: 'image/*',
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        uppy.addFile(files[i]);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <div
        className="select-none cursor-pointer w-[40px] p-[5px] text-center"
        onClick={handleClick}
        title={t('insert_image', 'Insert Image')}
      >
        🖼️
      </div>
    </>
  );
};
