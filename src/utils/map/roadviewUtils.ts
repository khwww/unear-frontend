import { showToast } from '@/utils/toast';
import type {
  KakaoMap,
  KakaoCustomOverlay,
  KakaoRoadview,
  KakaoRoadviewClient,
} from '@/types/kakao';

/**
 * 로드뷰 컨테이너 스타일
 */
const ROADVIEW_CONTAINER_STYLE = `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: white;
  display: none;
  overflow: hidden;
`;

/**
 * 닫기 버튼 스타일
 */
const CLOSE_BUTTON_STYLE = `
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
`;

/**
 * 닫기 버튼 SVG 아이콘
 */
const CLOSE_BUTTON_SVG = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
`;

interface RoadviewRefs {
  roadviewRef: React.MutableRefObject<KakaoRoadview | null>;
  roadviewClientRef: React.MutableRefObject<KakaoRoadviewClient | null>;
  closeButtonRef: React.MutableRefObject<HTMLButtonElement | null>;
  loadviewOverlaysRef: React.MutableRefObject<KakaoCustomOverlay[]>;
}

/**
 * 로드뷰 도로 오버레이 표시
 */
export const showRoadviewOverlay = (map: KakaoMap): void => {
  try {
    map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
  } catch {
    // 오버레이 추가 실패 무시
  }
  showToast('지도에서 로드뷰 도로를 클릭하세요.');
};

/**
 * 로드뷰 도로 오버레이 제거
 */
export const clearRoadviewOverlay = (
  map: KakaoMap | null,
  loadviewOverlaysRef: React.MutableRefObject<KakaoCustomOverlay[]>
): void => {
  loadviewOverlaysRef.current.forEach((overlay) => {
    if (overlay && overlay.setMap) {
      overlay.setMap(null);
    }
  });
  loadviewOverlaysRef.current = [];

  if (map) {
    try {
      map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
    } catch {
      // 오버레이 제거 실패 무시
    }
  }
};

/**
 * 로드뷰 컨테이너 표시 설정
 */
const showRoadviewContainer = (container: HTMLElement): void => {
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '1000';
  container.style.display = 'block';
  container.style.overflow = 'hidden';
};

interface OpenRoadviewParams {
  lat: number;
  lng: number;
  refs: RoadviewRefs;
  onRoadviewStateChange?: (isActive: boolean) => void;
  initializeRoadview: () => void;
}

/**
 * 로드뷰 열기
 */
export const openRoadview = ({
  lat,
  lng,
  refs,
  onRoadviewStateChange,
  initializeRoadview,
}: OpenRoadviewParams): void => {
  const { roadviewRef, roadviewClientRef, closeButtonRef } = refs;

  if (!roadviewRef.current || !roadviewClientRef.current) {
    initializeRoadview();
  }

  const position = new window.kakao.maps.LatLng(lat, lng);
  const roadviewContainer = document.getElementById('roadview-container');

  if (roadviewContainer) {
    showRoadviewContainer(roadviewContainer);
    onRoadviewStateChange?.(true);
  } else {
    return;
  }

  if (roadviewClientRef.current) {
    roadviewClientRef.current.getNearestPanoId(position, 50, (panoId: string | null) => {
      if (panoId === null) {
        showToast('이 위치에서는 로드뷰를 사용할 수 없습니다.');
        if (roadviewContainer) {
          roadviewContainer.style.display = 'none';
        }
        onRoadviewStateChange?.(false);
      } else {
        if (roadviewRef.current) {
          roadviewRef.current.setPanoId(panoId, position);

          setTimeout(() => {
            if (roadviewRef.current) {
              roadviewRef.current.relayout();
            }
            if (closeButtonRef.current) {
              closeButtonRef.current.style.display = 'flex';
            }
          }, 100);
        }
      }
    });
  }
};

interface CreateRoadviewElementsParams {
  mapContainer: HTMLElement;
  refs: RoadviewRefs;
  onRoadviewStateChange?: (isActive: boolean) => void;
}

/**
 * 로드뷰 컨테이너 및 닫기 버튼 생성
 */
export const createRoadviewElements = ({
  mapContainer,
  refs,
  onRoadviewStateChange,
}: CreateRoadviewElementsParams): HTMLDivElement | null => {
  if (!window.kakao || !window.kakao.maps) {
    return null;
  }

  const { roadviewRef, roadviewClientRef, closeButtonRef } = refs;

  // 기존 컨테이너 제거
  const existingContainer = document.getElementById('roadview-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // 로드뷰 컨테이너 생성
  const roadviewContainer = document.createElement('div');
  roadviewContainer.id = 'roadview-container';
  roadviewContainer.style.cssText = ROADVIEW_CONTAINER_STYLE;

  // 닫기 버튼 생성
  const closeButton = document.createElement('button');
  closeButtonRef.current = closeButton;
  closeButton.innerHTML = CLOSE_BUTTON_SVG;
  closeButton.style.cssText = CLOSE_BUTTON_STYLE;

  // DOM에 추가
  mapContainer.appendChild(roadviewContainer);
  mapContainer.appendChild(closeButton);

  // 닫기 버튼 클릭 이벤트
  closeButton.addEventListener('click', () => {
    roadviewContainer.style.display = 'none';
    closeButton.style.display = 'none';
    onRoadviewStateChange?.(false);
  });

  // 로드뷰 객체 생성
  try {
    roadviewRef.current = new window.kakao.maps.Roadview(roadviewContainer);
    roadviewClientRef.current = new window.kakao.maps.RoadviewClient();

    window.kakao.maps.event.addListener(roadviewRef.current, 'init', () => {});
    window.kakao.maps.event.addListener(roadviewRef.current, 'panorama_changed', () => {});
  } catch {
    // 로드뷰 초기화 실패 무시
  }

  return roadviewContainer;
};
