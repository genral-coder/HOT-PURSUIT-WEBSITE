import { storage } from "@hotpursuit/shared";

/**
 * Favorites data-access abstraction.
 *
 * Currently backed by localStorage (client-side only). Structured so it can be
 * swapped to a remote source WITHOUT changing consumers, following:
 *
 *   Discord Account  →  Database  →  Favorites
 *
 * To migrate: implement a `FavoritesStore` that fetches/persists via the API
 * (keyed by the authenticated user's discordUserId) and pass it to the hook /
 * provider. Consumers only depend on this interface.
 */
export interface FavoritesStore {
  list(): number[];
  add(id: number): void;
  remove(id: number): void;
  has(id: number): boolean;
}

const KEY = "hp_favorites";

/** localStorage implementation (current). */
export const localStorageFavorites: FavoritesStore = {
  list: () => storage.get<number[]>(KEY, []),
  add: (id) => {
    const cur = new Set(storage.get<number[]>(KEY, []));
    cur.add(id);
    storage.set(KEY, [...cur]);
  },
  remove: (id) => {
    storage.set(
      KEY,
      storage.get<number[]>(KEY, []).filter((x) => x !== id),
    );
  },
  has: (id) => storage.get<number[]>(KEY, []).includes(id),
};

export const favoritesStore: FavoritesStore = localStorageFavorites;
