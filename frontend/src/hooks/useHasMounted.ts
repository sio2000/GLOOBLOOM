"use client";

import { useEffect, useState } from "react";

/** True only after client mount — avoids SSR/client device detection mismatches. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
