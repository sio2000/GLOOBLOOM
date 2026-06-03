"use client";

import { useEffect, useState } from "react";

/** Loading exit fade + gap — keep in sync with TitleSplash */
export const SPLASH_ENTER_DELAY_MS = 2000;
export const SPLASH_VISIBLE_MS = 4000;

/** True while the centered GLOOBLOOM title watermark is on screen. */
export function useTitleSplashVisible(appReady: boolean): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!appReady) {
      setVisible(false);
      return;
    }

    const enterTimer = setTimeout(() => setVisible(true), SPLASH_ENTER_DELAY_MS);
    const hideTimer = setTimeout(
      () => setVisible(false),
      SPLASH_ENTER_DELAY_MS + SPLASH_VISIBLE_MS
    );

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(hideTimer);
    };
  }, [appReady]);

  return visible;
}
