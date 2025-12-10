import { useRef, useState, useEffect, useCallback } from 'react';
import type { KakaoMap, KakaoCustomOverlay, KakaoRoadview, KakaoRoadviewClient } from '@/types/kakao';
import {
  showRoadviewOverlay,
  clearRoadviewOverlay,
  openRoadview,
  createRoadviewElements,
} from '@/utils/map';

interface UseRoadviewParams {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapInstanceRef: React.RefObject<KakaoMap | null>;
  onLoadviewStateChange?: (isActive: boolean) => void;
  onRoadviewStateChange?: (isOpen: boolean) => void;
}

interface UseRoadviewReturn {
  isLoadviewActive: boolean;
  toggleLoadview: (isActive: boolean) => void;
  openLoadviewHandler: (lat: number, lng: number) => void;
  initializeRoadview: () => void;
  isLoadviewActiveRef: React.RefObject<boolean>;
}

/**
 * 로드뷰 관련 로직을 관리하는 훅
 */
export const useRoadview = ({
  mapContainerRef,
  mapInstanceRef,
  onLoadviewStateChange,
  onRoadviewStateChange,
}: UseRoadviewParams): UseRoadviewReturn => {
  const [isLoadviewActive, setIsLoadviewActive] = useState(false);
  const isLoadviewActiveRef = useRef(false);
  const loadviewOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const roadviewRef = useRef<KakaoRoadview | null>(null);
  const roadviewClientRef = useRef<KakaoRoadviewClient | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // 로드뷰 관련 refs 객체
  const roadviewRefs = {
    roadviewRef,
    roadviewClientRef,
    closeButtonRef,
    loadviewOverlaysRef,
  };

  const showLoadviewRoads = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    clearRoadviewOverlay(map, loadviewOverlaysRef);
    showRoadviewOverlay(map);
  }, [mapInstanceRef]);

  const clearLoadviewRoads = useCallback(() => {
    clearRoadviewOverlay(mapInstanceRef.current, loadviewOverlaysRef);
  }, [mapInstanceRef]);

  const toggleLoadview = useCallback(
    (isActive: boolean) => {
      setIsLoadviewActive(isActive);
      isLoadviewActiveRef.current = isActive;
      onLoadviewStateChange?.(isActive);
    },
    [onLoadviewStateChange]
  );

  const initializeRoadview = useCallback(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    createRoadviewElements({
      mapContainer,
      refs: roadviewRefs,
      onRoadviewStateChange,
    });
  }, [mapContainerRef, onRoadviewStateChange]);

  const openLoadviewHandler = useCallback(
    (lat: number, lng: number) => {
      openRoadview({
        lat,
        lng,
        refs: roadviewRefs,
        onRoadviewStateChange,
        initializeRoadview,
      });
    },
    [onRoadviewStateChange, initializeRoadview]
  );

  // isLoadviewActive 상태가 변경될 때마다 로드뷰 도로 표시 상태 업데이트
  useEffect(() => {
    if (isLoadviewActive) {
      showLoadviewRoads();
    } else {
      clearLoadviewRoads();
    }
  }, [isLoadviewActive, showLoadviewRoads, clearLoadviewRoads]);

  return {
    isLoadviewActive,
    toggleLoadview,
    openLoadviewHandler,
    initializeRoadview,
    isLoadviewActiveRef,
  };
};

export default useRoadview;
