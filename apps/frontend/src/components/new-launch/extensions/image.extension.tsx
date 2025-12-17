import { Node, mergeAttributes } from '@tiptap/core';

export const ImageExtension = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string }) =>
        // @ts-ignore - TipTap internal types
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});
