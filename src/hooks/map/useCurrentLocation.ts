import { useRef, useState, useCallback } from 'react';
import type { KakaoMap, KakaoCustomOverlay } from '@/types/kakao';
import { createCurrentLocationOverlay, getCurrentPosition } from '@/utils/map';

interface UseCurrentLocationReturn {
  currentLocation: { lat: number; lng: number } | null;
  isLocationShown: boolean;
  showCurrentLocation: (map: KakaoMap | null) => void;
  renderCurrentLocation: (lat: number, lng: number, map: KakaoMap | null) => void;
}

/**
 * 현재 위치 관련 로직을 관리하는 훅
 */
export const useCurrentLocation = (): UseCurrentLocationReturn => {
  const overlayRef = useRef<KakaoCustomOverlay | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationShown, setIsLocationShown] = useState(false);

  const renderCurrentLocation = useCallback((lat: number, lng: number, map: KakaoMap | null) => {
    if (!map) return;

    // 기존 오버레이 제거
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    const overlay = createCurrentLocationOverlay(lat, lng, map);
    overlayRef.current = overlay;
  }, []);

  const showCurrentLocation = useCallback(
    (map: KakaoMap | null) => {
      getCurrentPosition()
        .then(({ lat, lng }) => {
          setCurrentLocation({ lat, lng });
          renderCurrentLocation(lat, lng, map);
          map?.setCenter(new window.kakao.maps.LatLng(lat, lng));
          setIsLocationShown(true);
        })
        .catch((error) => {
          if (error.message === '이 브라우저는 위치 정보 사용을 지원하지 않습니다.') {
            alert(error.message);
          }
        });
    },
    [renderCurrentLocation]
  );

  return {
    currentLocation,
    isLocationShown,
    showCurrentLocation,
    renderCurrentLocation,
  };
};

export default useCurrentLocation;
