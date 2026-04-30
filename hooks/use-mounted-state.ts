'use client';

import { useEffect, useState } from 'react';

export function useMountedState() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}