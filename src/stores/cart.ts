import type {
    CartLine,
    CartState,
} from '../types/cart';

const CART_STORAGE_KEY = 'maxipawz-cart-v1';

const CART_CHANGE_EVENT =
    'maxipawz:cart-change';

const CART_DRAWER_EVENT =
    'maxipawz:cart-drawer';

const MAXIMUM_ITEM_QUANTITY = 99;

type CartSubscriber = (
    state: CartState,
) => void;

type DrawerSubscriber = (
    isOpen: boolean,
) => void;

interface CartDrawerEventDetail {
    open: boolean;
}

let cartState = createEmptyCartState();
let drawerOpen = false;

let cartInitialized = false;
let globalListenersAttached = false;

const cartSubscribers =
    new Set<CartSubscriber>();

const drawerSubscribers =
    new Set<DrawerSubscriber>();

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function cloneCartLine(
    line: CartLine,
): CartLine {
    return {
        productSlug: line.productSlug,
        variantId: line.variantId,
        quantity: line.quantity,
    };
}

function cloneCartState(
    state: CartState,
): CartState {
    return {
        version: 1,

        lines: state.lines.map(
            cloneCartLine,
        ),

        updatedAt: state.updatedAt,
    };
}

function sanitizeQuantity(
    value: unknown,
): number {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
    ) {
        return 1;
    }

    return Math.min(
        MAXIMUM_ITEM_QUANTITY,
        Math.max(1, Math.floor(value)),
    );
}

function sanitizeCartLine(
    value: unknown,
): CartLine | null {
    if (!isRecord(value)) {
        return null;
    }

    if (
        typeof value.productSlug !==
        'string' ||
        !value.productSlug.trim()
    ) {
        return null;
    }

    const productSlug =
        value.productSlug.trim();

    const variantId =
        typeof value.variantId === 'string' &&
            value.variantId.trim()
            ? value.variantId.trim()
            : undefined;

    return {
        productSlug,
        variantId,

        quantity: sanitizeQuantity(
            value.quantity,
        ),
    };
}

export function getCartLineKey(
    productSlug: string,
    variantId?: string,
): string {
    return `${productSlug}::${variantId ?? 'default'}`;
}

function sanitizeCartState(
    value: unknown,
): CartState {
    const rawLines =
        isRecord(value) &&
            Array.isArray(value.lines)
            ? value.lines
            : [];

    const deduplicatedLines =
        new Map<string, CartLine>();

    rawLines.forEach((rawLine) => {
        const line =
            sanitizeCartLine(rawLine);

        if (!line) {
            return;
        }

        const key = getCartLineKey(
            line.productSlug,
            line.variantId,
        );

        const existing =
            deduplicatedLines.get(key);

        if (existing) {
            existing.quantity =
                sanitizeQuantity(
                    existing.quantity +
                    line.quantity,
                );

            return;
        }

        deduplicatedLines.set(
            key,
            line,
        );
    });

    const updatedAt =
        isRecord(value) &&
            typeof value.updatedAt === 'number' &&
            Number.isFinite(value.updatedAt)
            ? value.updatedAt
            : Date.now();

    return {
        version: 1,

        lines: Array.from(
            deduplicatedLines.values(),
        ),

        updatedAt,
    };
}

export function createEmptyCartState(): CartState {
    return {
        version: 1,
        lines: [],
        updatedAt: 0,
    };
}

function readStoredCart(): CartState {
    if (!isBrowser()) {
        return createEmptyCartState();
    }

    try {
        const storedValue =
            window.localStorage.getItem(
                CART_STORAGE_KEY,
            );

        if (!storedValue) {
            return createEmptyCartState();
        }

        return sanitizeCartState(
            JSON.parse(storedValue),
        );
    } catch {
        return createEmptyCartState();
    }
}

function writeStoredCart(
    state: CartState,
): void {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(state),
        );
    } catch {
        // The in-memory cart can still work when storage is unavailable.
    }
}

function notifyCartSubscribers(): void {
    const snapshot =
        cloneCartState(cartState);

    cartSubscribers.forEach(
        (subscriber) => {
            subscriber(snapshot);
        },
    );
}

function notifyDrawerSubscribers(): void {
    drawerSubscribers.forEach(
        (subscriber) => {
            subscriber(drawerOpen);
        },
    );
}

function attachGlobalListeners(): void {
    if (
        !isBrowser() ||
        globalListenersAttached
    ) {
        return;
    }

    globalListenersAttached = true;

    window.addEventListener(
        CART_CHANGE_EVENT,
        (event: Event) => {
            const customEvent =
                event as CustomEvent<CartState>;

            cartState = sanitizeCartState(
                customEvent.detail,
            );

            notifyCartSubscribers();
        },
    );

    window.addEventListener(
        CART_DRAWER_EVENT,
        (event: Event) => {
            const customEvent =
                event as CustomEvent<CartDrawerEventDetail>;

            drawerOpen = Boolean(
                customEvent.detail?.open,
            );

            notifyDrawerSubscribers();
        },
    );

    window.addEventListener(
        'storage',
        (event) => {
            if (
                event.key !==
                CART_STORAGE_KEY
            ) {
                return;
            }

            if (!event.newValue) {
                cartState =
                    createEmptyCartState();

                notifyCartSubscribers();
                return;
            }

            try {
                cartState =
                    sanitizeCartState(
                        JSON.parse(
                            event.newValue,
                        ),
                    );
            } catch {
                cartState =
                    createEmptyCartState();
            }

            notifyCartSubscribers();
        },
    );
}

function ensureCartInitialized(): void {
    if (!isBrowser()) {
        return;
    }

    attachGlobalListeners();

    if (cartInitialized) {
        return;
    }

    cartInitialized = true;
    cartState = readStoredCart();
}

function commitCartLines(
    lines: CartLine[],
): void {
    ensureCartInitialized();

    cartState = sanitizeCartState({
        version: 1,
        lines,

        updatedAt: Math.max(
            Date.now(),
            cartState.updatedAt + 1,
        ),
    });

    writeStoredCart(cartState);

    if (isBrowser()) {
        window.dispatchEvent(
            new CustomEvent<CartState>(
                CART_CHANGE_EVENT,
                {
                    detail:
                        cloneCartState(
                            cartState,
                        ),
                },
            ),
        );

        return;
    }

    notifyCartSubscribers();
}

export function getCartState(): CartState {
    ensureCartInitialized();

    return cloneCartState(cartState);
}

export function subscribeCart(
    subscriber: CartSubscriber,
): () => void {
    ensureCartInitialized();

    cartSubscribers.add(subscriber);

    return () => {
        cartSubscribers.delete(
            subscriber,
        );
    };
}

export function addCartLine(
    productSlug: string,
    options: {
        variantId?: string;
        quantity?: number;
    } = {},
): void {
    ensureCartInitialized();

    const quantity =
        sanitizeQuantity(
            options.quantity ?? 1,
        );

    const key = getCartLineKey(
        productSlug,
        options.variantId,
    );

    const nextLines =
        cartState.lines.map(
            cloneCartLine,
        );

    const existingLine =
        nextLines.find(
            (line) =>
                getCartLineKey(
                    line.productSlug,
                    line.variantId,
                ) === key,
        );

    if (existingLine) {
        existingLine.quantity =
            sanitizeQuantity(
                existingLine.quantity +
                quantity,
            );
    } else {
        nextLines.push({
            productSlug,
            variantId:
                options.variantId,
            quantity,
        });
    }

    commitCartLines(nextLines);
}

export function setCartLineQuantity(
    productSlug: string,
    variantId: string | undefined,
    quantity: number,
): void {
    ensureCartInitialized();

    const key = getCartLineKey(
        productSlug,
        variantId,
    );

    if (quantity <= 0) {
        removeCartLine(
            productSlug,
            variantId,
        );

        return;
    }

    const nextLines =
        cartState.lines.map(
            (line) => {
                const lineKey =
                    getCartLineKey(
                        line.productSlug,
                        line.variantId,
                    );

                if (lineKey !== key) {
                    return cloneCartLine(line);
                }

                return {
                    ...cloneCartLine(line),

                    quantity:
                        sanitizeQuantity(
                            quantity,
                        ),
                };
            },
        );

    commitCartLines(nextLines);
}

export function removeCartLine(
    productSlug: string,
    variantId?: string,
): void {
    ensureCartInitialized();

    const key = getCartLineKey(
        productSlug,
        variantId,
    );

    commitCartLines(
        cartState.lines.filter(
            (line) =>
                getCartLineKey(
                    line.productSlug,
                    line.variantId,
                ) !== key,
        ),
    );
}

export function clearCart(): void {
    commitCartLines([]);
}

export function subscribeCartDrawer(
    subscriber: DrawerSubscriber,
): () => void {
    ensureCartInitialized();

    drawerSubscribers.add(
        subscriber,
    );

    return () => {
        drawerSubscribers.delete(
            subscriber,
        );
    };
}

export function getCartDrawerOpen(): boolean {
    ensureCartInitialized();

    return drawerOpen;
}

function setCartDrawerOpen(
    open: boolean,
): void {
    ensureCartInitialized();

    if (isBrowser()) {
        window.dispatchEvent(
            new CustomEvent<CartDrawerEventDetail>(
                CART_DRAWER_EVENT,
                {
                    detail: {
                        open,
                    },
                },
            ),
        );

        return;
    }

    drawerOpen = open;
    notifyDrawerSubscribers();
}

export function openCartDrawer(): void {
    setCartDrawerOpen(true);
}

export function closeCartDrawer(): void {
    setCartDrawerOpen(false);
}