import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import type { KakaoMap, KakaoMarkerClusterer } from '@/types/kakao';
import { MapProvider } from '@/contexts/MapContext';
import EventAreaCircle from './EventAreaCircle';
import { CLUSTERER_STYLES, CLUSTERER_CONFIG } from './constants';
import {
  initializeClusterer,
  waitForMapReady,
  setupMapEventListeners,
  isFilterStorageEvent,
} from '@/utils/map';
import { useCurrentLocation, useRoadview, useMarkers } from '@/hooks/map';

export interface MapContainerRef {
  showCurrentLocation: () => void;
  setCenter: (lat: number, lng: number) => void;
  setLevel: (level: number) => void;
  fetchPlaces: () => void;
  getBounds: () => ReturnType<typeof window.kakao.maps.Map.prototype.getBounds> | null;
  deselectMarker?: () => void;
  selectMarker?: (placeId: number) => void;
  setSelectedMarker: (placeId: number) => void;
  getCenter: () => { lat: number; lng: number } | null;
  toggleLoadview: (isActive: boolean) => void;
}

interface MapContainerProps {
  isBookmarkOnly: boolean;
  categoryCodes: string[];
  benefitCategories: string[];
  shouldRestoreLocation: boolean;
  onMarkerClick: (placeId: number, latitude: string, longitude: string) => void;
  onMarkerDeselect?: () => void;
  onLoadviewStateChange?: (isActive: boolean) => void;
  onRoadviewStateChange?: (isOpen: boolean) => void;
}

const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  (
    {
      isBookmarkOnly,
      categoryCodes,
      benefitCategories,
      shouldRestoreLocation,
      onMarkerClick,
      onMarkerDeselect,
      onLoadviewStateChange,
      onRoadviewStateChange,
    },
    ref
  ) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const kakaoMapKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const mapInstanceRef = useRef<KakaoMap | null>(null);
    const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
    const isSettingCenterRef = useRef(false);
    const clustererRef = useRef<KakaoMarkerClusterer | null>(null);

    // 디바운싱을 위한 ref
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 커스텀 훅 사용
    const { currentLocation, isLocationShown, showCurrentLocation, renderCurrentLocation } =
      useCurrentLocation();

    const { toggleLoadview, openLoadviewHandler, initializeRoadview, isLoadviewActiveRef } =
      useRoadview({
        mapContainerRef: mapRef,
        mapInstanceRef,
        onLoadviewStateChange,
        onRoadviewStateChange,
      });

    const {
      selectedPlaceIdRef,
      markerInstancesRef,
      renderMarkers: renderMarkersBase,
      clearSelectedMarker: clearSelectedMarkerBase,
    } = useMarkers({
      onMarkerClick,
      isLocationShown,
      renderCurrentLocation,
      currentLocation,
    });

    // 마커 렌더링 래퍼 (map, clusterer 주입)
    const renderMarkers = useCallback(() => {
      renderMarkersBase(mapInstanceRef.current, clustererRef.current);
    }, [renderMarkersBase]);

    // 마커 선택 해제 래퍼
    const clearSelectedMarker = useCallback(() => {
      clearSelectedMarkerBase(onMarkerDeselect);
    }, [clearSelectedMarkerBase, onMarkerDeselect]);

    // 디바운싱된 renderMarkers 함수
    const debouncedRenderMarkers = useCallback(() => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        renderMarkers();
      }, 500);
    }, [renderMarkers]);

    // 현재 위치 표시 래퍼
    const handleShowCurrentLocation = useCallback(() => {
      showCurrentLocation(mapInstanceRef.current);
    }, [showCurrentLocation]);

    useImperativeHandle(ref, () => ({
      showCurrentLocation: handleShowCurrentLocation,
      deselectMarker: () => {
        clearSelectedMarker();
      },
      setSelectedMarker: (placeId) => {
        selectedPlaceIdRef.current = placeId;
      },
      setCenter: (lat, lng) => {
        const map = mapInstanceRef.current;
        if (map) {
          isSettingCenterRef.current = true;
          map.setCenter(new window.kakao.maps.LatLng(lat, lng));
          setTimeout(() => {
            isSettingCenterRef.current = false;
            renderMarkers();
          }, 500);
        }
      },
      setLevel: (level) => {
        const map = mapInstanceRef.current;
        if (map) {
          isSettingCenterRef.current = true;
          map.setLevel(level);
          setTimeout(() => {
            isSettingCenterRef.current = false;
            renderMarkers();
          }, 500);
        }
      },
      fetchPlaces: () => {
        if (mapInstanceRef.current) {
          renderMarkers();
        }
      },
      getBounds: () => {
        return mapInstanceRef.current?.getBounds() || null;
      },
      selectMarker: (placeId: number) => {
        selectedPlaceIdRef.current = placeId;
      },
      getCenter: () => {
        const map = mapInstanceRef.current;
        if (!map) return null;
        const center = map.getCenter();
        return {
          lat: center.getLat(),
          lng: center.getLng(),
        };
      },
      toggleLoadview,
    }));

    // 필터링 상태가 변경될 때마다 마커를 다시 렌더링
    useEffect(() => {
      if (mapInstanceRef.current) {
        renderMarkers();
      }
    }, [isBookmarkOnly, categoryCodes, benefitCategories, renderMarkers]);

    // 카카오맵 초기화
    useEffect(() => {
      if (!kakaoMapKey) {
        return;
      }

      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=clusterer`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(() => {
            const container = mapRef.current;
            if (!container) return;

            const map = new window.kakao.maps.Map(container, {
              center: new window.kakao.maps.LatLng(37.555, 126.822),
              level: 4,
            });

            mapInstanceRef.current = map;

            const handleClustererInit = () => {
              initializeClusterer({
                map,
                config: CLUSTERER_CONFIG,
                styles: CLUSTERER_STYLES,
                onSuccess: (clusterer) => {
                  clustererRef.current = clusterer;
                },
                onFailure: () => {
                  clustererRef.current = null;
                },
              });
            };

            waitForMapReady({
              map,
              onReady: handleClustererInit,
              onTimeout: () => {
                console.warn('지도 로딩 시간 초과: 개별 마커 모드로 전환');
                clustererRef.current = null;
              },
            });

            setMapInstance(map);

            // 현재 위치 표시
            showCurrentLocation(map);

            // 로드뷰 초기화
            initializeRoadview();

            // 지도 이벤트 리스너 설정
            setupMapEventListeners(map, {
              onTilesLoaded: () => {
                if (!clustererRef.current) {
                  handleClustererInit();
                }
              },
              onIdle: () => {
                if (!isSettingCenterRef.current) {
                  debouncedRenderMarkers();
                }
              },
              onZoomChanged: debouncedRenderMarkers,
              onMapClick: openLoadviewHandler,
              isLoadviewActive: () => isLoadviewActiveRef.current,
            });

            renderMarkers();
          });
        }
      };

      script.onerror = () => {};

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if (clustererRef.current && markerInstancesRef.current.length > 0) {
          clustererRef.current.removeMarkers(markerInstancesRef.current);
        }
      };
    }, [kakaoMapKey]);

    // 위치 복원
    useEffect(() => {
      if (shouldRestoreLocation && mapInstanceRef.current && currentLocation) {
        const { lat, lng } = currentLocation;
        mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      }
    }, [shouldRestoreLocation, currentLocation]);

    // 로컬스토리지 변경 감지
    useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
        if (isFilterStorageEvent(e.key) && mapInstanceRef.current) {
          renderMarkers();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [renderMarkers]);

    // refreshMapStores 이벤트 구독
    useEffect(() => {
      const handleRefreshMarkers = () => {
        if (mapInstanceRef.current) {
          renderMarkers();
        }
      };

      window.addEventListener('refreshMapStores', handleRefreshMarkers);
      return () => {
        window.removeEventListener('refreshMapStores', handleRefreshMarkers);
      };
    }, [renderMarkers]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    return (
      <MapProvider
        value={{
          map: mapInstance,
          clusterer: clustererRef.current,
          refreshMarkers: renderMarkers,
        }}
      >
        <div ref={mapRef} className="w-full h-full absolute top-0 left-0 z-0">
          {mapInstance && (
            <EventAreaCircle center={{ lat: 37.544581, lng: 127.055961 }} radius={800} />
          )}
        </div>
      </MapProvider>
    );
  }
);

export default MapContainer;
