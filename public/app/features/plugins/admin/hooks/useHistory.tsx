import { locationService } from '@grafana/runtime';

/**
 * Custom hook for navigation that wraps locationService with React Router v6-style API.
 * 
 * This hook provides a navigate function compatible with React Router v6 patterns:
 * - navigate({ query: {...} }) - updates query parameters (equivalent to history.push with query)
 * - navigate(path, { replace: true }) - navigates to a path with replace option
 * - navigate(path) - navigates to a path (push)
 * 
 * For backward compatibility, the hook also exposes a push method that matches the old API.
 * 
 * @returns An object with navigate and push methods
 */
export const useHistory = () => {
  const navigate = (
    to: string | { query: Parameters<typeof locationService.partial>[0] },
    options?: { replace?: boolean }
  ) => {
    // Handle query parameter updates (backward compatible with old API)
    if (typeof to === 'object' && 'query' in to) {
      locationService.partial(to.query, options?.replace);
      return;
    }

    // Handle path navigation (React Router v6 style)
    if (typeof to === 'string') {
      if (options?.replace) {
        locationService.replace(to);
      } else {
        locationService.push(to);
      }
      return;
    }
  };

  // Backward compatibility: maintain the old push API
  const push = ({ query }: { query: Parameters<typeof locationService.partial>[0] }) => {
    locationService.partial(query);
  };

  return {
    navigate,
    push, // Maintained for backward compatibility
  };
};
