import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { MapContainerRef } from '@/components/map/MapContainer';
import MapContainer from '@/components/map/MapContainer';
import SearchBar from '@/components/common/SearchBar';
import MapActionButtons from '@/components/map/MapActionButtons';
import MapTopRightButtons from '@/components/map/MapTopRightButtons';
import BottomSheetEvent from '@/components/map/BottomSheetEvent';
import BottomSheetBarcode from '@/components/common/BottomSheetBarcode';
import MapLocationButton from '@/components/map/MapLocationButton';
import BottomSheetFilter from '@/components/map/BottomSheetFilter';
import BottomSheetCoupon from '@/components/map/BottomSheetCoupon';
import { useAuthStore } from '@/store/auth';
import BottomSheetLocationDetail from '@/components/map/BottomSheetLocationDetail';
import { getPlaceDetail } from '@/apis/getPlaceDetail';
import type { StoreData } from '@/types/storeDetail';
import { getPlacesForSearch } from '@/apis/getPlaces';
import BottomSheetSearchList from '@/components/map/BottomSheetSearchList';
import { showInfoToast } from '@/utils/toast';
import { useMapFilter, useMapSearch } from '@/hooks/map';

const MapPage = () => {
  const location = useLocation();
  const mapRef = useRef<MapContainerRef | null>(null);

  // 커스텀 훅 사용
  const { isBookmarkOnly, categoryCodes, benefitCategories, toggleBookmark, applyFilter } =
    useMapFilter();

  const {
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
  } = useMapSearch({ mapRef });

  // UI 상태
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: string; longitude: string } | null>(
    null
  );
  const [isLoadviewActive, setIsLoadviewActive] = useState(false);
  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);

  // 사용자 정보
  const { getUserDisplayName, getUserGrade, getBarcodeNumber } = useAuthStore();
  const displayName = getUserDisplayName();
  const userGrade = getUserGrade();
  const barcodeValue = getBarcodeNumber();
  const gradeForComponent = userGrade === 'BASIC' ? '우수' : userGrade;

  useEffect(() => {
    if (isRoadviewOpen) {
      // 로드뷰가 열렸을 때
    }
  }, [isRoadviewOpen]);

  // 필터링 상태가 변경될 때마다 지도 마커를 다시 렌더링
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current?.fetchPlaces?.();
    }
  }, [categoryCodes, benefitCategories, isBookmarkOnly]);

  // 외부에서 매장으로 포커스할 때 처리
  useEffect(() => {
    const focusStore = location.state?.focusStore;
    if (focusStore) {
      if (focusStore.latitude && focusStore.longitude) {
        const focusOnStore = () => {
          const map = mapRef.current;

          if (!map || !map.setCenter) {
            setTimeout(() => focusOnStore(), 300);
            return;
          }

          try {
            map.deselectMarker?.();
            map.setCenter(focusStore.latitude, focusStore.longitude);

            setTimeout(() => {
              map.setSelectedMarker(focusStore.placeId);

              handleMarkerClick(
                focusStore.placeId,
                String(focusStore.latitude),
                String(focusStore.longitude)
              );
            }, 600);
          } catch {
            // 에러 처리
          }
        };

        setTimeout(() => {
          focusOnStore();
        }, 500);
      } else if (focusStore.searchKeyword) {
        const performSearch = async () => {
          try {
            setSearchKeyword(focusStore.searchKeyword);
            const map = mapRef.current;
            if (!map || !map.getBounds) {
              setTimeout(() => performSearch(), 500);
              return;
            }

            const bounds = map.getBounds();
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

            const results = await getPlacesForSearch({
              keyword: focusStore.searchKeyword,
              southWestLatitude: swLat,
              southWestLongitude: swLng,
              northEastLatitude: neLat,
              northEastLongitude: neLng,
            });

            if (results.length > 0) {
              setSearchResults(results);
              setSearchOpen(true);

              const exactMatch = results.find((result) => result.placeId === focusStore.placeId);

              const nameMatch = !exactMatch
                ? results.find(
                    (result) =>
                      result.placeName.includes(focusStore.placeName) ||
                      focusStore.placeName.includes(result.placeName)
                  )
                : null;

              const matchedStore = exactMatch || nameMatch;

              if (matchedStore) {
                setTimeout(() => {
                  handleMarkerClick(
                    matchedStore.placeId,
                    String(matchedStore.latitude),
                    String(matchedStore.longitude)
                  );
                }, 1000);
              }
            } else {
              showInfoToast(`'${focusStore.placeName}' 매장을 찾을 수 없습니다.`);
            }
          } catch {
            showInfoToast('매장 검색 중 오류가 발생했습니다.');
          }
        };

        performSearch();
      }
      window.history.replaceState({}, document.title);
    }
  }, [
    location.state,
    setSearchKeyword,
    setCurrentLat,
    setCurrentLng,
    setSearchResults,
    setSearchOpen,
  ]);

  // 매장 새로고침 이벤트 리스너
  useEffect(() => {
    const handleRefreshStores = () => {
      mapRef.current?.fetchPlaces();
    };

    window.addEventListener('refreshMapStores', handleRefreshStores);
    return () => {
      window.removeEventListener('refreshMapStores', handleRefreshStores);
    };
  }, []);

  const handleCurrentLocation = () => {
    mapRef.current?.showCurrentLocation();
  };

  const handleMoveToJuniorLocation = () => {
    mapRef.current?.setCenter(37.544581, 127.055961);
    mapRef.current?.setLevel(6);
  };

  const handleMarkerClick = async (placeId: number, _storeLat: string, _storeLng: string) => {
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude.toString();
          const userLng = pos.coords.longitude.toString();

          const storeDetail = await getPlaceDetail(placeId, userLat, userLng);
          setUserLocation({ latitude: userLat, longitude: userLng });
          setSelectedStore(storeDetail);
          setIsBottomSheetOpen(true);
        },
        () => {
          // 위치 권한 거부 처리
        }
      );
    } catch {
      // 에러 처리
    }
  };

  const handleToggleBookmark = () => {
    toggleBookmark();
    setTimeout(() => {
      mapRef.current?.fetchPlaces?.();
    }, 0);
  };

  const handleApplyFilter = (categories: string[], benefits: string[]) => {
    applyFilter(categories, benefits);
    setTimeout(() => {
      mapRef.current?.fetchPlaces?.();
    }, 0);
  };

  return (
    <div className="relative w-full h-[calc(100dvh-65px)] bg-white">
      {/* 지도 영역 */}
      <MapContainer
        ref={mapRef}
        isBookmarkOnly={isBookmarkOnly}
        categoryCodes={categoryCodes}
        benefitCategories={benefitCategories}
        shouldRestoreLocation={false}
        onMarkerClick={handleMarkerClick}
        onMarkerDeselect={() => {}}
        onLoadviewStateChange={(isActive) => {
          setIsLoadviewActive(isActive);
        }}
        onRoadviewStateChange={(isOpen) => {
          setIsRoadviewOpen(isOpen);
        }}
      />

      {/* 상단 검색바 - 로드뷰 화면이 열렸을 때만 숨김 */}
      {!isRoadviewOpen && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-[600px] px-2.5">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* 좌측 하단 버튼 그룹 - 로드뷰 화면이 열렸을 때만 숨김 */}
      {!isRoadviewOpen && (
        <MapActionButtons
          onEventClick={() => setIsEventOpen(true)}
          onBarcodeClick={() => setIsBarcodeOpen(true)}
          onCouponClick={() => setIsCouponOpen(true)}
        />
      )}

      {/* 우측 하단 위치 버튼 - 로드뷰 화면이 열렸을 때만 숨김 */}
      {!isRoadviewOpen && <MapLocationButton onClick={handleCurrentLocation} />}

      {/* 우측 상단 필터링/즐겨찾기 버튼 - 로드뷰 화면이 열렸을 때만 숨김 */}
      {!isRoadviewOpen && (
        <MapTopRightButtons
          onToggleFilter={() => setIsFilterOpen(true)}
          onToggleBookmark={handleToggleBookmark}
          onToggleLoadview={(isActive) => {
            setIsLoadviewActive(isActive);
            mapRef.current?.toggleLoadview?.(isActive);
          }}
          isBookmarkOnly={isBookmarkOnly}
          isLoadviewActive={isLoadviewActive}
          categoryCodes={categoryCodes}
          benefitCategories={benefitCategories}
        />
      )}
      <BottomSheetEvent
        isOpen={isEventOpen}
        onClose={() => setIsEventOpen(false)}
        onMoveToJuniorLocation={handleMoveToJuniorLocation}
      />
      <BottomSheetCoupon
        isOpen={isCouponOpen}
        onClose={() => setIsCouponOpen(false)}
        mapRef={mapRef}
        onMarkerClick={handleMarkerClick}
      />
      <BottomSheetBarcode
        userName={displayName}
        userGrade={gradeForComponent}
        barcodeValue={barcodeValue}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      <BottomSheetFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilter}
        selectedCategoryCodes={categoryCodes}
        selectedBenefitCategories={benefitCategories}
      />

      {/* 바텀시트 - store가 있을 때만 렌더 */}
      {selectedStore && userLocation && (
        <BottomSheetLocationDetail
          store={selectedStore}
          isOpen={isBottomSheetOpen}
          onClose={() => {
            setIsBottomSheetOpen(false);
            mapRef.current?.deselectMarker?.();
          }}
          mapRef={mapRef}
          userLocation={userLocation}
        />
      )}

      {/* 검색 결과 바텀시트 */}
      {searchResults.length > 0 && currentLat !== null && currentLng !== null && (
        <BottomSheetSearchList
          results={searchResults}
          keyword={searchKeyword}
          isOpen={isSearchOpen}
          onClose={closeSearch}
          currentLat={String(currentLat)}
          currentLng={String(currentLng)}
          onBookmarkToggle={() => {}}
          onCouponDownloaded={() => {}}
          onCouponClick={(_userCouponId: string, _brand: string) => {}}
          mapRef={mapRef}
          onMarkerClick={handleMarkerClick}
        />
      )}
    </div>
  );
};

export default MapPage;
