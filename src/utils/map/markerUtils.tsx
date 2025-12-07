import ReactDOMServer from 'react-dom/server';
import MapMarkerIcon from '@/components/common/MapMarkerIcon';
import PlaceNameLabel from '@/components/map/PlaceNameLabel';
import type { Place } from '@/types/map';
import type { KakaoMarker, KakaoMap, KakaoMarkerClusterer } from '@/types/kakao';

/**
 * 마커 컨테이너 스타일
 */
const MARKER_CONTAINER_STYLE = `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

/**
 * 마커 컨테이너 요소 생성
 */
export const createMarkerContainer = (): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.cssText = MARKER_CONTAINER_STYLE;
  return container;
};

/**
 * 마커 아이콘 요소 생성
 */
export const createMarkerElement = (
  place: Place,
  isSelected: boolean,
  onClick: () => void
): HTMLElement | null => {
  const markerHTML = ReactDOMServer.renderToString(
    <MapMarkerIcon
      category={place.categoryCode}
      storeClass={place.markerCode}
      event={place.eventCode}
      isSelected={isSelected}
    />
  );

  const markerEl = document.createElement('div');
  markerEl.innerHTML = markerHTML;
  const markerElement = markerEl.firstElementChild as HTMLElement;

  if (markerElement) {
    markerElement.addEventListener('click', onClick);
  }

  return markerElement;
};

/**
 * 장소명 라벨 요소 생성
 */
export const createPlaceNameElement = (
  placeName: string,
  onClick: () => void
): HTMLElement | null => {
  const textHTML = ReactDOMServer.renderToString(
    <PlaceNameLabel placeName={placeName} onClick={onClick} />
  );

  const textEl = document.createElement('div');
  textEl.innerHTML = textHTML;
  const textElement = textEl.firstElementChild as HTMLElement;

  if (textElement) {
    textElement.addEventListener('click', onClick);
  }

  return textElement;
};

interface CreatePlaceMarkerParams {
  place: Place;
  isSelected: boolean;
  showLabel: boolean;
  onMarkerClick: (placeId: number, lat: string, lng: string) => void;
  onSelect: (placeId: number) => void;
}

/**
 * 장소 마커 생성 (컨테이너 + 아이콘 + 라벨)
 */
export const createPlaceMarker = ({
  place,
  isSelected,
  showLabel,
  onMarkerClick,
  onSelect,
}: CreatePlaceMarkerParams): KakaoMarker => {
  const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);

  // 클릭 핸들러
  const handleClick = () => {
    onSelect(place.placeId);
    onMarkerClick(place.placeId, String(place.latitude), String(place.longitude));
  };

  // 컨테이너 생성
  const containerElement = createMarkerContainer();

  // 마커 아이콘 추가
  const markerElement = createMarkerElement(place, isSelected, handleClick);
  if (markerElement) {
    containerElement.appendChild(markerElement);
  }

  // 라벨 추가 (showLabel이 true일 때만)
  if (showLabel) {
    const labelElement = createPlaceNameElement(place.placeName, handleClick);
    if (labelElement) {
      containerElement.appendChild(labelElement);
    }
  }

  // CustomOverlay 생성
  const customOverlay = new window.kakao.maps.CustomOverlay({
    position,
    content: containerElement,
    yAnchor: 0.5,
    zIndex: 1,
  });

  // 투명 마커 생성 (클러스터러 호환용)
  const marker = new window.kakao.maps.Marker({ position });
  marker.setOpacity(0);

  // setMap 오버라이드하여 CustomOverlay와 연동
  const originalSetMap = marker.setMap;
  marker.setMap = function (mapInstance) {
    originalSetMap.call(this, mapInstance);
    customOverlay.setMap(mapInstance);
  };

  return marker;
};

interface AddMarkersToMapParams {
  markers: KakaoMarker[];
  map: KakaoMap;
  clusterer: KakaoMarkerClusterer | null;
  placesCount: number;
  currentZoom: number;
}

/**
 * 마커를 지도에 추가
 * - 마커 수가 3개 이하이거나 줌 레벨이 6 이하면 개별 마커로 표시
 * - 그 외에는 클러스터러 사용
 */
export const addMarkersToMap = ({
  markers,
  map,
  clusterer,
  placesCount,
  currentZoom,
}: AddMarkersToMapParams): void => {
  const addIndividualMarkers = () => {
    markers.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(map);
      }
    });
  };

  try {
    if (placesCount <= 3 || currentZoom <= 6) {
      addIndividualMarkers();
    } else if (clusterer && clusterer.addMarkers) {
      try {
        clusterer.addMarkers(markers);
      } catch {
        addIndividualMarkers();
      }
    } else {
      addIndividualMarkers();
    }
  } catch {
    addIndividualMarkers();
  }
};

/**
 * 기존 마커들을 지도에서 제거
 */
export const clearMarkers = (
  markers: KakaoMarker[],
  clusterer: KakaoMarkerClusterer | null
): void => {
  if (markers.length === 0) return;

  markers.forEach((m) => {
    if (m && m.setMap) {
      m.setMap(null);
    }
  });

  if (clusterer) {
    try {
      clusterer.removeMarkers(markers);
      clusterer.clear();
    } catch {
      // 클러스터러 에러 무시
    }
  }
};
