import { Node, mergeAttributes } from '@tiptap/core';

export const YouTubeExtension = Node.create({
  name: 'youtube',
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 560,
      },
      height: {
        default: 315,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const iframe = node as HTMLIFrameElement;
          return {
            src: iframe.getAttribute('src'),
            width: iframe.getAttribute('width') || 560,
            height: iframe.getAttribute('height') || 315,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: 'true',
      }),
    ];
  },

  addCommands() {
    return {
      setYouTube:
        (options: { src: string; width?: number; height?: number }) =>
        // @ts-ignore - TipTap internal types
        ({ commands }) => {
          // Convert YouTube URL to embed format
          let embedUrl = options.src;
          if (embedUrl.includes('youtube.com/watch?v=')) {
            const videoId = embedUrl.split('v=')[1]?.split('&')[0];
            if (videoId) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          } else if (embedUrl.includes('youtu.be/')) {
            const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
              width: options.width || 560,
              height: options.height || 315,
            },
          });
        },
    } as any;
  },
});
