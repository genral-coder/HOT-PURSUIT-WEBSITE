import { useCallback, useState } from "react";
import { favoritesStore, type FavoritesStore } from "@/services/favorites";

/**
 * React binding over a FavoritesStore. Defaults to the localStorage store but
 * accepts any store (e.g. a future API-backed store) for the
 * Discord → Database → Favorites migration path.
 */
export function useFavorites(store: FavoritesStore = favoritesStore) {
  const [ids, setIds] = useState<number[]>(() => store.list());

  const refresh = useCallback(() => setIds(store.list()), [store]);

  const isFavorite = useCallback((id: number) => ids.includes(id), [ids]);

  const toggleFavorite = useCallback(
    (id: number) => {
      const isFav = ids.includes(id);
      if (isFav) store.remove(id);
      else store.add(id);
      refresh();
    },
    [ids, store, refresh],
  );

  return {
    favorites: ids,
    count: ids.length,
    isFavorite,
    toggleFavorite,
  };
}
