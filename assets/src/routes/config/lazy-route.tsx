import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";

type LazyRouteModule = {
  Component: ComponentType;
  loader?: RouteObject["loader"];
};

export function withLazyRouteImportRecovery<T extends LazyRouteModule>(
  loadRouteModule: () => Promise<T>,
) {
  return async () => {
    try {
      return await loadRouteModule();
    } catch (error) {
      return {
        Component: function LazyRouteImportFailure() {
          return null;
        },
        loader: function lazyRouteImportFailureLoader(): never {
          throw error;
        },
      };
    }
  };
}
