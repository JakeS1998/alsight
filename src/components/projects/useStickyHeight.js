import { useLayoutEffect } from 'react';
export default function useStickyHeight(ref, variable) {
  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!parent) return;
    const measure = () => parent.style.setProperty(variable, `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); parent.style.removeProperty(variable); };
  }, [ref, variable]);
}