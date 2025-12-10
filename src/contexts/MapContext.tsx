import { createContext, useContext } from 'react';
import type { KakaoMap, KakaoMarkerClusterer } from '@/types/kakao.d';

interface MapContextValue {
  map: KakaoMap | null;
  clusterer: KakaoMarkerClusterer | null;
}

const MapContext = createContext<MapContextValue | null>(null);

/**
 * Map Context를 사용하기 위한 훅
 * Map 컴포넌트 내부에서만 사용 가능
 */
export const useMapContext = (): MapContextValue => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

/**
 * Map Context를 안전하게 사용하기 위한 훅 (optional)
 * Context가 없어도 에러를 던지지 않음
 */
export const useMapContextSafe = (): MapContextValue | null => {
  return useContext(MapContext);
};

export const MapProvider = MapContext.Provider;

export default MapContext;
