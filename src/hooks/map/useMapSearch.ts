import { useState, useCallback } from 'react';
import type { Place } from '@/types/map';
import type { MapContainerRef } from '@/components/map/MapContainer';
import { getPlacesForSearch } from '@/apis/getPlaces';
import { showInfoToast } from '@/utils/toast';

interface UseMapSearchParams {
  mapRef: React.RefObject<MapContainerRef | null>;
}

interface UseMapSearchReturn {
  searchResults: Place[];
  searchKeyword: string;
  isSearchOpen: boolean;
  currentLat: number | null;
  currentLng: number | null;
  handleSearch: (keyword: string) => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
  setSearchOpen: (isOpen: boolean) => void;
  setSearchResults: (results: Place[]) => void;
  setCurrentLat: (lat: number | null) => void;
  setCurrentLng: (lng: number | null) => void;
  closeSearch: () => void;
}

/**
 * 지도 검색 기능을 관리하는 훅
 */
export const useMapSearch = ({ mapRef }: UseMapSearchParams): UseMapSearchReturn => {
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);

  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) return;
      setSearchKeyword(keyword);
      setSearchOpen(true);

      const map = mapRef.current;
      if (!map || !map.getBounds) return;

      const bounds = map.getBounds?.();
      if (!bounds) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const centerLat = (sw.getLat() + ne.getLat()) / 2;
      const centerLng = (sw.getLng() + ne.getLng()) / 2;

      setCurrentLat(centerLat);
      setCurrentLng(centerLng);

      const delta = 0.09;
      const swLat = centerLat - delta;
      const swLng = centerLng - delta;
      const neLat = centerLat + delta;
      const neLng = centerLng + delta;

      try {
        const results = await getPlacesForSearch({
          keyword,
          southWestLatitude: swLat,
          southWestLongitude: swLng,
          northEastLatitude: neLat,
          northEastLongitude: neLng,
        });

        if (results.length === 0) {
          showInfoToast(`주변에 '${keyword}' 에 대한 검색 결과가 없습니다.`);
          return;
        }

        setSearchResults(results);
      } catch {
        // 에러 처리
      }
    },
    [mapRef]
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchResults([]);
  }, []);

  return {
    searchResults,
    searchKeyword,
    isSearchOpen,
    currentLat,
    currentLng,
    handleSearch,
    setSearchKeyword,
    setSearchOpen,
    setSearchResults,
    setCurrentLat,
    setCurrentLng,
    closeSearch,
  };
};

export default useMapSearch;
