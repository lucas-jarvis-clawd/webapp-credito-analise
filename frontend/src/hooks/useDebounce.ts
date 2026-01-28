import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e filtros
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualizar valor após delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelar o timeout se value mudar (também no cleanup)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;