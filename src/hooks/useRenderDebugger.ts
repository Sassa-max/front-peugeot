import { useEffect, useRef } from "react";

export function useRenderDebugger(name, props) {
  const prev = useRef(props);
  useEffect(() => {
    const changed = Object.keys({ ...prev.current, ...props })
      .filter(k => prev.current[k] !== props[k]);
    if (changed.length) {
      console.log(`[${name}] re-rendered because:`, changed);
    } else {
      console.log(`[${name}] re-rendered with no prop changes`);
    }
    prev.current = props;
  });
}
