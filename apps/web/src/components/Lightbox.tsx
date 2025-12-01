import * as Dialog from '@radix-ui/react-dialog';
import { GalleryItem } from '../lib/contentClient';
import { useEffect } from 'react';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function Lightbox({ isOpen, onClose, item, onNext, onPrev, hasNext, hasPrev }: LightboxProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev]);

  if (!item) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] p-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
          aria-describedby="lightbox-description"
        >
          <Dialog.Title className="sr-only">
            {item.title}
          </Dialog.Title>
          <div id="lightbox-description" className="sr-only">
            {item.altText}
          </div>

          <div className="relative flex items-center justify-center w-full h-full">
            {/* Previous Button */}
            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="absolute left-0 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Image */}
            <div className="relative max-h-[85vh] overflow-hidden rounded-lg">
              <img
                src={item.imageUrl}
                alt={item.altText}
                className="max-h-[85vh] w-auto object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 text-white">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.caption && <p className="text-sm mt-1">{item.caption}</p>}
              </div>
            </div>

            {/* Next Button */}
            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-0 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            {/* Close Button */}
            <Dialog.Close asChild>
              <button
                className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full"
                aria-label="Close lightbox"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
