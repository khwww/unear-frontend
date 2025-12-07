import type { KakaoMap, KakaoLatLng, KakaoMarkerClusterer } from '@/types/kakao';

interface MapEventHandlers {
  onTilesLoaded: () => void;
  onIdle: () => void;
  onZoomChanged: () => void;
  onMapClick: (lat: number, lng: number) => void;
  isLoadviewActive: () => boolean;
}

/**
 * 지도 이벤트 리스너 설정
 */
export const setupMapEventListeners = (map: KakaoMap, handlers: MapEventHandlers): void => {
  const { onTilesLoaded, onIdle, onZoomChanged, onMapClick, isLoadviewActive } = handlers;

  // 지도 타일 로드 완료 이벤트
  window.kakao.maps.event.addListener(map, 'tilesloaded', () => {
    onTilesLoaded();
  });

  // 지도 이동/확대 완료 이벤트
  window.kakao.maps.event.addListener(map, 'idle', () => {
    onIdle();
  });

  // 지도 레벨 변경 이벤트
  window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
    onZoomChanged();
  });

  // 지도 클릭 이벤트 (로드뷰 모드용)
  window.kakao.maps.event.addListener(map, 'click', (mouseEvent?: { latLng?: KakaoLatLng }) => {
    if (isLoadviewActive() && mouseEvent?.latLng) {
      const position = mouseEvent.latLng;
      onMapClick(position.getLat(), position.getLng());
    }
  });
};

interface ClustererEventHandlers {
  onClusterClick: (center: KakaoLatLng, currentLevel: number) => void;
}

/**
 * 클러스터러 이벤트 리스너 설정
 */
export const setupClustererEventListeners = (
  map: KakaoMap,
  clusterer: KakaoMarkerClusterer,
  handlers: ClustererEventHandlers
): void => {
  window.kakao.maps.event.addListener(
    clusterer,
    'clusterclick',
    (cluster: KakaoMarkerClusterer) => {
      const currentLevel = map.getLevel();
      const center = cluster.getCenter();
      handlers.onClusterClick(center, currentLevel);
    }
  );
};
