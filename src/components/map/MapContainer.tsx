import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import type {
  KakaoMap,
  KakaoCustomOverlay,
  KakaoMarkerClusterer,
  KakaoMarker,
  KakaoRoadview,
  KakaoRoadviewClient,
} from '@/types/kakao';
import EventAreaCircle from './EventAreaCircle';
import { getPlaces } from '@/apis/getPlaces';
import { CLUSTERER_STYLES, CLUSTERER_CONFIG } from './constants';
import {
  createPlaceMarker,
  addMarkersToMap,
  clearMarkers,
  showRoadviewOverlay,
  clearRoadviewOverlay,
  openRoadview,
  createRoadviewElements,
  initializeClusterer,
  waitForMapReady,
  createCurrentLocationOverlay,
  getCurrentPosition,
  setupMapEventListeners,
  getStoredFilterState,
  isFilterStorageEvent,
} from '@/utils/map';

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
    const overlayRef = useRef<KakaoCustomOverlay | null>(null);
    const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);
    const [isLocationShown, setIsLocationShown] = useState(false);
    const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
    const selectedPlaceIdRef = useRef<number | null>(null);
    const isSettingCenterRef = useRef(false);
    const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
    const markerInstancesRef = useRef<KakaoMarker[]>([]);
    const [isLoadviewActive, setIsLoadviewActive] = useState(false);
    const isLoadviewActiveRef = useRef(false);
    const loadviewOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
    const roadviewRef = useRef<KakaoRoadview | null>(null);
    const roadviewClientRef = useRef<KakaoRoadviewClient | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    // 디바운싱을 위한 ref
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // isLoadviewActive 상태가 변경될 때마다 로드뷰 도로 표시 상태 업데이트
    useEffect(() => {
      if (isLoadviewActive) {
        showLoadviewRoads();
      } else {
        clearLoadviewRoads();
      }
    }, [isLoadviewActive]);

    const clearSelectedMarker = () => {
      selectedPlaceIdRef.current = null;
      onMarkerDeselect?.();
    };

    const toggleLoadview = (isActive: boolean) => {
      setIsLoadviewActive(isActive);
      isLoadviewActiveRef.current = isActive;
      onLoadviewStateChange?.(isActive);
    };

    // 로드뷰 관련 refs 객체
    const roadviewRefs = {
      roadviewRef,
      roadviewClientRef,
      closeButtonRef,
      loadviewOverlaysRef,
    };

    const showLoadviewRoads = () => {
      const map = mapInstanceRef.current;
      if (!map) return;

      clearLoadviewRoads();
      showRoadviewOverlay(map);
    };

    const openLoadviewHandler = (lat: number, lng: number) => {
      openRoadview({
        lat,
        lng,
        refs: roadviewRefs,
        onRoadviewStateChange,
        initializeRoadview,
      });
    };

    const clearLoadviewRoads = () => {
      clearRoadviewOverlay(mapInstanceRef.current, loadviewOverlaysRef);
    };

    const initializeRoadview = () => {
      const mapContainer = mapRef.current;
      if (!mapContainer) return;

      createRoadviewElements({
        mapContainer,
        refs: roadviewRefs,
        onRoadviewStateChange,
      });
    };

    const renderCurrentLocation = useCallback((lat: number, lng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }

      const overlay = createCurrentLocationOverlay(lat, lng, map);
      overlayRef.current = overlay;
    }, []);

    const showCurrentLocation = () => {
      getCurrentPosition()
        .then(({ lat, lng }) => {
          currentLocationRef.current = { lat, lng };
          renderCurrentLocation(lat, lng);
          mapInstanceRef.current?.setCenter(new window.kakao.maps.LatLng(lat, lng));
          setIsLocationShown(true);
        })
        .catch((error) => {
          if (error.message === '이 브라우저는 위치 정보 사용을 지원하지 않습니다.') {
            alert(error.message);
          }
        });
    };

    useImperativeHandle(ref, () => ({
      showCurrentLocation,
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
        } else {
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

    // 디바운싱된 renderMarkers 함수
    const debouncedRenderMarkers = useCallback(() => {
      // 기존 타이머가 있다면 취소
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // 500ms 후에 실행
      debounceTimeoutRef.current = setTimeout(() => {
        renderMarkers();
      }, 500);
    }, []);

    const renderMarkers = useCallback(async () => {
      const map = mapInstanceRef.current;
      const clusterer = clustererRef.current;
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
          if (!isLocationShown && currentLocationRef.current) {
            renderCurrentLocation(currentLocationRef.current.lat, currentLocationRef.current.lng);
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
        const currentZoom = mapInstanceRef.current?.getLevel?.() ?? 4;

        // 마커를 지도에 추가
        addMarkersToMap({
          markers: newMarkers,
          map,
          clusterer,
          placesCount: places.length,
          currentZoom,
        });

        if (!isLocationShown && currentLocationRef.current) {
          renderCurrentLocation(currentLocationRef.current.lat, currentLocationRef.current.lng);
        }

        // 마커 업데이트 후 지도 다시 그리기
        const center = map.getCenter();
        map.setCenter(center);
      } catch (error) {}
    }, [isLocationShown, onMarkerClick]);

    // 필터링 상태가 변경될 때마다 마커를 다시 렌더링
    useEffect(() => {
      if (mapInstanceRef.current) {
        renderMarkers();
      }
    }, [isBookmarkOnly, categoryCodes, benefitCategories, renderMarkers]);

    // selectedPlaceId가 변경될 때는 renderMarkers를 호출하지 않음
    // 마커 선택 상태는 renderMarkers 내에서 처리됨

    useEffect(() => {
      if (!kakaoMapKey) {
        return;
      }

      // 기존 스크립트가 있다면 제거
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
        // 카카오맵 API가 완전히 로드되었는지 확인
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(() => {
            const container = mapRef.current;
            if (!container) return;

            const map = new window.kakao.maps.Map(container, {
              center: new window.kakao.maps.LatLng(37.555, 126.822),
              level: 4,
            });

            mapInstanceRef.current = map;

            // 클러스터러 초기화 핸들러
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

            // 지도 로드 완료 대기 후 클러스터러 초기화
            waitForMapReady({
              map,
              onReady: handleClustererInit,
              onTimeout: () => {
                console.warn('지도 로딩 시간 초과: 개별 마커 모드로 전환');
                clustererRef.current = null;
              },
            });

            setMapInstance(map);

            showCurrentLocation();

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
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
        }
      };
    }, [kakaoMapKey]);

    useEffect(() => {
      if (shouldRestoreLocation && mapInstanceRef.current && currentLocationRef.current) {
        const { lat, lng } = currentLocationRef.current;
        mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      }
    }, [shouldRestoreLocation]);

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

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div ref={mapRef} className="w-full h-full absolute top-0 left-0 z-0">
        {mapInstance && (
          <EventAreaCircle
            center={{ lat: 37.544581, lng: 127.055961 }}
            radius={800}
            map={mapInstance}
          />
        )}
      </div>
    );
  }
);

export default MapContainer;
