import { debounce } from 'lodash';
import { useEffect, useState } from 'react';

export const useResize = (
  elementRef: React.RefObject<HTMLElement>,
  ratio: number
) => {
  // TODO: Pull up defaults to some kind of config file
  // TODO: Cap max height to keep from scrolling out of view
  const [size, setSize] = useState([0, 0]);

  useEffect(() => {
    const onResize = () => {
      requestAnimationFrame(() => {
        if (elementRef.current) {
          console.debug(
            'Resizing to ',
            elementRef.current.clientWidth,
            Math.floor(elementRef.current.clientWidth / ratio)
          );

          // BUG: resizing has extra margin when resizing window smaller than canvas width
          setSize([
            elementRef.current.clientWidth,
            Math.floor(elementRef.current.clientWidth / ratio)
          ]);
        } else {
          console.warn(
            'Cannot resize, elementRef.current is null...',
            elementRef.current
          );
        }
      });
    };

    const debouncedResize = debounce(onResize, 100);

    onResize();
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return size;
};
