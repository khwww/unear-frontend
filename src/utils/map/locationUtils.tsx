import ReactDOMServer from 'react-dom/server';
import CurrentLocationMarker from '@/components/map/CurrentLocationMarker';
import type { KakaoMap, KakaoCustomOverlay } from '@/types/kakao';

/**
 * 현재 위치 오버레이 생성
 */
export const createCurrentLocationOverlay = (
  lat: number,
  lng: number,
  map: KakaoMap
): KakaoCustomOverlay => {
  const currentLatLng = new window.kakao.maps.LatLng(lat, lng);

  const markerHTML = ReactDOMServer.renderToString(<CurrentLocationMarker />);
  const el = document.createElement('div');
  el.innerHTML = markerHTML;

  const overlay = new window.kakao.maps.CustomOverlay({
    position: currentLatLng,
    content: el.firstElementChild as Node,
    yAnchor: 0.5,
    zIndex: 2,
  });

  overlay.setMap(map);
  return overlay;
};

interface GetCurrentPositionResult {
  lat: number;
  lng: number;
}

/**
 * 현재 GPS 위치 가져오기 (Promise 래핑)
 */
export const getCurrentPosition = (): Promise<GetCurrentPositionResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보 사용을 지원하지 않습니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        reject(error);
      }
    );
  });
};
