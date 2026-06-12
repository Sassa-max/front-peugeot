import { useRef, useEffect } from "react";

export function useWhyDidYouRender(name: string, props: any, state: any) {
  const previous = useRef<{ props: any; state: any }>({ props, state });

  useEffect(() => {
    const changedProps: string[] = [];
    const changedState: string[] = [];

    if (previous.current) {
      // Check props
      for (const key in props) {
        if (props[key] !== previous.current.props[key]) {
          changedProps.push(key);
        }
      }

      // Check state
      for (const key in state) {
        if (state[key] !== previous.current.state[key]) {
          changedState.push(key);
        }
      }

      if (changedProps.length || changedState.length) {
        console.log(
          `[${name}] re-rendered. Changed props:`,
          changedProps,
          "Changed state:",
          changedState
        );
      } else {
        console.log(`[${name}] re-rendered with no prop/state changes`);
      }
    }

    previous.current = { props, state };
  });
}
