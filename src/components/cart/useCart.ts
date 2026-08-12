import { useEffect, useState } from 'preact/hooks';

import {
  createEmptyCartState,
  getCartDrawerOpen,
  getCartState,
  subscribeCart,
  subscribeCartDrawer,
} from '../../stores/cart';

import type { CartState } from '../../types/cart';

export function useCart(): {
  state: CartState;
  hydrated: boolean;
} {
  const [state, setState] = useState<CartState>(createEmptyCartState());

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getCartState());
    setHydrated(true);

    return subscribeCart(setState);
  }, []);

  return {
    state,
    hydrated,
  };
}

export function useCartDrawer(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(getCartDrawerOpen());

    return subscribeCartDrawer(setOpen);
  }, []);

  return open;
}
