'use client';

import { useEffect, useState } from 'react';

export function useMedia(query: string, defaultState = false): boolean {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setState(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return state;
}