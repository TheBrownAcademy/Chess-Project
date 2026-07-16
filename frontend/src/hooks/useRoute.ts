import { useState, useEffect } from "react";

/**
 * Custom React hook to subscribe to path updates in a single page application.
 * Listens to both native popstate and our custom pushstate events.
 */
export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("pushstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate", handleLocationChange);
    };
  }, []);

  return path;
}

/**
 * Programmatically navigate to a path using HTML5 History API.
 * Dispatches a custom pushstate event to notify any useRoute subscribers.
 */
export const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("pushstate"));
};
