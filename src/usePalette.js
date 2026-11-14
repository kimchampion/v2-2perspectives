import { useCallback, useEffect, useRef, useState } from "react";
import { fetchColors } from "./color-api.js";
import { presetColors } from "./data.js";

const presets = () =>
  presetColors.map((color) => ({ ...color, source: "Preset palette" }));

export default function usePalette() {
  const [items, setItems] = useState(presets);
  const [status, setStatus] = useState("loading");
  const mounted = useRef(false);
  const currentRequest = useRef(null);
  const generation = useRef(0);

  const retry = useCallback(() => {
    if (!mounted.current) return;
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    const requestGeneration = ++generation.current;
    setItems(presets());
    setStatus("loading");
    fetchColors({ signal: controller.signal })
      .then(
        (colors) => {
          if (
            !mounted.current ||
            controller.signal.aborted ||
            requestGeneration !== generation.current
          )
            return;
          setItems(colors);
          setStatus("live");
        },
        () => {
          if (
            !mounted.current ||
            controller.signal.aborted ||
            requestGeneration !== generation.current
          )
            return;
          setItems(presets());
          setStatus("fallback");
        },
      )
      .finally(() => {
        if (currentRequest.current === controller)
          currentRequest.current = null;
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    retry();
    return () => {
      mounted.current = false;
      ++generation.current;
      currentRequest.current?.abort();
      currentRequest.current = null;
    };
  }, [retry]);

  return { items, status, retry };
}
