import { useCallback, useState } from "react";
import { storage } from "@hotpursuit/shared";

const KEY = "hp_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() =>
    storage.get<number[]>(KEY, []),
  );

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      storage.set(KEY, next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
