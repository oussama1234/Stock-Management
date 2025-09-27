import { useCallback, useMemo, useRef } from 'react';
import { useProductData } from '../context/ProductDataContext';

/**
 * Hook to orchestrate printing the product document.
 * - Exposes a ref to attach to the printable container
 * - Waits for images to load for better print fidelity
 * - Uses memoized callbacks and values for performance
 */
export const useProductPrint = () => {
  const { isLoading, product } = useProductData();
  const printRef = useRef(null);

  const canPrint = useMemo(() => Boolean(product) && !isLoading, [product, isLoading]);

  const waitForImages = useCallback(async () => {
    const node = printRef.current;
    if (!node) return;

    const images = Array.from(node.querySelectorAll('img'));
    const pending = images.filter((img) => !img.complete);
    if (pending.length === 0) return;

    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              const done = () => {
                img.removeEventListener('load', done);
                img.removeEventListener('error', done);
                resolve();
              };
              img.addEventListener('load', done);
              img.addEventListener('error', done);
            })
        )
      ),
      // Failsafe timeout to avoid hanging if an image never loads
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  }, []);

  const handlePrint = useCallback(() => {
    if (!canPrint) return;
    // Call print immediately to preserve the user gesture in browsers that restrict async print
    window.print();
    // Fire-and-forget image wait in case the print engine evaluates late
    // (kept for future enhancement; does not block the gesture)
    void waitForImages();
  }, [canPrint, waitForImages]);

  return { printRef, handlePrint, canPrint };
};
