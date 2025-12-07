import type { KakaoMap, KakaoMarkerClusterer } from '@/types/kakao';

/**
 * 클러스터러 초기화 설정
 */
interface ClustererConfig {
  averageCenter: boolean;
  minLevel: number;
  disableClickZoom: boolean;
  minClusterSize: number;
  gridSize: number;
  calculator: number[];
}

interface ClustererStyles {
  width: string;
  height: string;
  background: string;
  borderRadius: string;
  color: string;
  textAlign: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  boxShadow: string;
  opacity: string;
}

interface InitializeClustererParams {
  map: KakaoMap;
  config: ClustererConfig;
  styles: readonly ClustererStyles[];
  onSuccess: (clusterer: KakaoMarkerClusterer) => void;
  onFailure: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 지도가 준비되었는지 확인
 */
const isMapReady = (map: KakaoMap): boolean => {
  try {
    if (!map || typeof map.getLevel !== 'function') return false;
    const level = map.getLevel();
    const center = map.getCenter();
    return level !== undefined && center !== null;
  } catch {
    return false;
  }
};

/**
 * MarkerClusterer가 사용 가능한지 확인
 */
const isClustererAvailable = (): boolean => {
  return (
    !!window.kakao?.maps?.MarkerClusterer && typeof window.kakao.maps.MarkerClusterer === 'function'
  );
};

/**
 * 클러스터러 초기화 (재시도 로직 포함)
 */
export const initializeClusterer = ({
  map,
  config,
  styles,
  onSuccess,
  onFailure,
  maxRetries = 10,
  retryDelay = 500,
}: InitializeClustererParams): void => {
  const tryInitialize = (retryCount: number) => {
    try {
      // 지도가 완전히 로드되었는지 확인
      if (!isMapReady(map)) {
        if (retryCount < maxRetries) {
          setTimeout(() => tryInitialize(retryCount + 1), retryDelay);
          return;
        } else {
          console.warn('지도 로딩 실패: 최대 재시도 횟수 초과');
          onFailure();
          return;
        }
      }

      // MarkerClusterer가 사용 가능한지 확인
      if (!isClustererAvailable()) {
        if (retryCount < maxRetries) {
          setTimeout(() => tryInitialize(retryCount + 1), retryDelay);
          return;
        } else {
          console.warn('MarkerClusterer가 아직 로드되지 않았습니다.');
          onFailure();
          return;
        }
      }

      // 클러스터러 생성
      const clusterer = new window.kakao.maps.MarkerClusterer({
        map,
        ...config,
        styles: [...styles],
      });

      // 클러스터 클릭 이벤트 리스너 추가
      window.kakao.maps.event.addListener(
        clusterer,
        'clusterclick',
        (cluster: KakaoMarkerClusterer) => {
          const currentLevel = map.getLevel();
          const newLevel = Math.max(1, currentLevel - 2);

          const center = cluster.getCenter();
          map.setCenter(center);
          map.setLevel(newLevel);
        }
      );

      onSuccess(clusterer);
    } catch {
      if (retryCount < maxRetries) {
        setTimeout(() => tryInitialize(retryCount + 1), retryDelay);
      } else {
        console.warn(
          'MarkerClusterer 초기화 실패: 최대 재시도 횟수 초과\n대안: 개별 마커 모드로 전환'
        );
        onFailure();
      }
    }
  };

  tryInitialize(0);
};

interface WaitForMapReadyParams {
  map: KakaoMap;
  onReady: () => void;
  onTimeout: () => void;
  maxAttempts?: number;
  checkInterval?: number;
}

/**
 * 지도가 준비될 때까지 대기
 */
export const waitForMapReady = ({
  map,
  onReady,
  onTimeout,
  maxAttempts = 20,
  checkInterval = 500,
}: WaitForMapReadyParams): void => {
  const checkMapReady = (attempts: number) => {
    if (isMapReady(map)) {
      onReady();
    } else if (attempts < maxAttempts) {
      setTimeout(() => checkMapReady(attempts + 1), checkInterval);
    } else {
      console.warn('지도 로딩 시간 초과: 개별 마커 모드로 전환');
      onTimeout();
    }
  };

  checkMapReady(0);
};
