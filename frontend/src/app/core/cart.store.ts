import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CartItem, Product } from './models';

function load(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem('mh-cart') ?? '[]');
    return Array.isArray(value)
      ? value
          .filter(
            (x) =>
              x.product?.id && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 20,
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState({ items: load() }),
  withComputed((s) => ({
    count: computed(() => s.items().reduce((n, x) => n + x.quantity, 0)),
    subtotal: computed(() => s.items().reduce((n, x) => n + x.product.price * x.quantity, 0)),
  })),
  withMethods((s) => {
    const save = (items: CartItem[]) => {
      patchState(s, { items });
      localStorage.setItem('mh-cart', JSON.stringify(items));
    };
    return {
      add(product: Product) {
        const existing = s.items().find((x) => x.product.id === product.id);
        if (product.stock === 0 || (existing?.quantity ?? 0) >= Math.min(20, product.stock))
          return false;
        if (!existing && s.items().length >= 30) return false;
        save(
          existing
            ? s
                .items()
                .map((x) =>
                  x.product.id === product.id ? { product, quantity: x.quantity + 1 } : x,
                )
            : [...s.items(), { product, quantity: 1 }],
        );
        return true;
      },
      quantity(id: string, quantity: number) {
        save(
          s.items().flatMap((x) =>
            x.product.id !== id
              ? [x]
              : quantity <= 0
                ? []
                : [
                    {
                      ...x,
                      quantity: Math.min(quantity, 20, x.product.stock),
                    },
                  ],
          ),
        );
      },
      clear() {
        save([]);
      },
    };
  }),
);
