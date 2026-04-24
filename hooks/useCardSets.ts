import { useState, useEffect, useCallback } from 'react';
import { CardSet, getCardSets } from '../services/db';

export function useCardSets() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCardSets();
      setSets(data);
      setError(null);
    } catch (e) {
      setError('데이터를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sets, loading, error, refresh };
}
