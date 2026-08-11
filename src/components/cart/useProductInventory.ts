import { useEffect, useState } from 'preact/hooks';

import type {
  ProductInventoryErrorResponse,
  ProductInventoryResponse,
  PublicInventorySnapshot,
} from '../../types/inventory';

export type ProductInventoryLookupStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseProductInventoryOptions {
  productSlug: string;

  variantId?: string;

  enabled: boolean;
}

interface ProductInventoryLookupResult {
  status: ProductInventoryLookupStatus;

  inventory?: PublicInventorySnapshot;

  message?: string;
}

export function useProductInventory({
  productSlug,
  variantId,
  enabled,
}: UseProductInventoryOptions): ProductInventoryLookupResult {
  const [result, setResult] = useState<ProductInventoryLookupResult>({
    status: 'idle',
  });

  useEffect(() => {
    if (!enabled) {
      setResult({
        status: 'idle',
      });

      return;
    }

    const controller = new AbortController();

    setResult({
      status: 'loading',
    });

    const loadInventory = async (): Promise<void> => {
      try {
        const searchParams = new URLSearchParams({
          product: productSlug,
        });

        if (variantId) {
          searchParams.set('variant', variantId);
        }

        const response = await fetch(`/api/product-inventory?${searchParams.toString()}`, {
          method: 'GET',

          headers: {
            Accept: 'application/json',
          },

          cache: 'no-store',

          signal: controller.signal,
        });

        let body: ProductInventoryResponse | ProductInventoryErrorResponse | null = null;

        try {
          body = (await response.json()) as
            | ProductInventoryResponse
            | ProductInventoryErrorResponse;
        } catch {
          body = null;
        }

        if (!response.ok || !body || body.ok === false) {
          const message =
            body && body.ok === false ? body.message : 'Inventory information could not be loaded.';

          throw new Error(message);
        }

        if (!body.inventory.tracked) {
          throw new Error('Live inventory is not configured for this product.');
        }

        setResult({
          status: 'ready',

          inventory: body.inventory,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setResult({
          status: 'error',

          message:
            error instanceof Error ? error.message : 'Inventory information could not be loaded.',
        });
      }
    };

    void loadInventory();

    return () => {
      controller.abort();
    };
  }, [enabled, productSlug, variantId]);

  return result;
}
