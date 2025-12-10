import { useRef, useCallback } from 'react';
import type { KakaoMap, KakaoMarker, KakaoMarkerClusterer } from '@/types/kakao';
import { getPlaces } from '@/apis/getPlaces';
import { createPlaceMarker, addMarkersToMap, clearMarkers, getStoredFilterState } from '@/utils/map';

interface UseMarkersParams {
  onMarkerClick: (placeId: number, latitude: string, longitude: string) => void;
  isLocationShown: boolean;
  renderCurrentLocation: (lat: number, lng: number, map: KakaoMap | null) => void;
  currentLocation: { lat: number; lng: number } | null;
}

interface UseMarkersReturn {
  selectedPlaceIdRef: React.RefObject<number | null>;
  markerInstancesRef: React.RefObject<KakaoMarker[]>;
  renderMarkers: (map: KakaoMap | null, clusterer: KakaoMarkerClusterer | null) => Promise<void>;
  clearSelectedMarker: (onMarkerDeselect?: () => void) => void;
  setSelectedMarker: (placeId: number) => void;
}

/**
 * 마커 관련 로직을 관리하는 훅
 */
export const useMarkers = ({
  onMarkerClick,
  isLocationShown,
  renderCurrentLocation,
  currentLocation,
}: UseMarkersParams): UseMarkersReturn => {
  const selectedPlaceIdRef = useRef<number | null>(null);
  const markerInstancesRef = useRef<KakaoMarker[]>([]);

  const clearSelectedMarker = useCallback((onMarkerDeselect?: () => void) => {
    selectedPlaceIdRef.current = null;
    onMarkerDeselect?.();
  }, []);

  const setSelectedMarker = useCallback((placeId: number) => {
    selectedPlaceIdRef.current = placeId;
  }, []);

  const renderMarkers = useCallback(
    async (map: KakaoMap | null, clusterer: KakaoMarkerClusterer | null) => {
      if (!map) return;

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const currentLevel = map.getLevel();

      const filterState = getStoredFilterState();

      try {
        const places = await getPlaces({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
          isFavorite: filterState.isBookmarkOnly,
          categoryCodes: filterState.categoryCodes,
          benefitCategories: filterState.benefitCategories,
        });

        // 기존 마커들을 완전히 제거
        if (markerInstancesRef.current.length > 0) {
          clearMarkers(markerInstancesRef.current, clusterer);
          markerInstancesRef.current = [];
        }

        if (places.length === 0) {
          if (isLocationShown && currentLocation) {
            renderCurrentLocation(currentLocation.lat, currentLocation.lng, map);
          }
          // 지도를 다시 그리기
          const center = map.getCenter();
          map.setCenter(center);
          return;
        }

        const newMarkers: KakaoMarker[] = places.map((place) =>
          createPlaceMarker({
            place,
            isSelected: selectedPlaceIdRef.current === place.placeId,
            showLabel: currentLevel <= 4,
            onMarkerClick,
            onSelect: (placeId) => {
              selectedPlaceIdRef.current = placeId;
            },
          })
        );

        markerInstancesRef.current = newMarkers;
        const currentZoom = map.getLevel?.() ?? 4;

        // 마커를 지도에 추가
        addMarkersToMap({
          markers: newMarkers,
          map,
          clusterer,
          placesCount: places.length,
          currentZoom,
        });

        if (isLocationShown && currentLocation) {
          renderCurrentLocation(currentLocation.lat, currentLocation.lng, map);
        }

        // 마커 업데이트 후 지도 다시 그리기
        const center = map.getCenter();
        map.setCenter(center);
      } catch {
        // 에러 처리
      }
    },
    [isLocationShown, onMarkerClick, renderCurrentLocation, currentLocation]
  );

  return {
    selectedPlaceIdRef,
    markerInstancesRef,
    renderMarkers,
    clearSelectedMarker,
    setSelectedMarker,
  };
};

export default useMarkers;
