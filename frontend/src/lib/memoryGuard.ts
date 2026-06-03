import type * as THREE from "three";

/** Best-effort GPU/RAM relief when pressure is detected. */
export function runMemoryGuard(gl: THREE.WebGLRenderer): void {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };

  if (perf.memory) {
    const ratio = perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit;
    if (ratio < 0.82) return;
  }

  gl.renderLists?.dispose?.();

  const info = gl.info;
  if (info.programs?.length && info.programs.length > 48) {
    info.programs.length = 0;
  }

  try {
    info.reset?.();
  } catch {
    /* ignore */
  }
}
