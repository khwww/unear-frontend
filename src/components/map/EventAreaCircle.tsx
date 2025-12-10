import { useEffect, useRef } from 'react';
import type { KakaoCircle } from '@/types/kakao';
import { useMapContext } from '@/contexts/MapContext';

interface EventAreaCircleProps {
  center: { lat: number; lng: number };
  radius: number;
}

const EventAreaCircle = ({ center, radius }: EventAreaCircleProps) => {
  const { map } = useMapContext();
  const circleRef = useRef<KakaoCircle | null>(null);

  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    // 메인 원 (3D 효과를 위한 다중 레이어)
    const mainCircle = new window.kakao.maps.Circle({
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      radius: radius,
      strokeWeight: 5,
      strokeColor: '#FF6B9D',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      fillColor: '#FF1493',
      fillOpacity: 0.15,
    });

    // 원들을 지도에 추가
    mainCircle.setMap(map);

    // 참조 저장
    circleRef.current = mainCircle;

    // 클린업 함수
    return () => {
      if (mainCircle) mainCircle.setMap(null);
    };
  }, [map, center.lat, center.lng, radius]);

  return null;
};

export default EventAreaCircle;
