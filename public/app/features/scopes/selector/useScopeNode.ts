import { useEffect, useState } from 'react';

import { ScopeNode } from '@grafana/data';
import { createMonitoringLogger } from '@grafana/runtime';

import { useScopesServices } from '../ScopesContextProvider';

const logger = createMonitoringLogger('scopes.selector.useScopeNode');

// Light wrapper around the scopesSelectorService.getScopeNode to make it easier to use in the UI.
export function useScopeNode(scopeNodeId?: string) {
  const [node, setNode] = useState<ScopeNode | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const scopesSelectorService = useScopesServices()?.scopesSelectorService;

  useEffect(() => {
    const loadNode = async () => {
      if (!scopeNodeId || !scopesSelectorService) {
        setNode(undefined);
        return;
      }
      setIsLoading(true);
      try {
        const node = await scopesSelectorService.getScopeNode(scopeNodeId);
        setNode(node);
      } catch (error) {
        logger.logError(error instanceof Error ? error : new Error(String(error)), {
          message: 'Failed to load node',
          scopeNodeId,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadNode();
  }, [scopeNodeId, scopesSelectorService]);

  return { node, isLoading };
}
