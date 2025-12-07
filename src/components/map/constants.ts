/**
 * 카카오맵 클러스터러 스타일 설정
 * - calculator: [10, 30, 50, 100, 200]에 대응하는 5단계 스타일
 * - 마커 개수에 따라 크기가 점진적으로 증가 (40px ~ 80px)
 */
export const CLUSTERER_STYLES = [
  {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '40px',
    boxShadow: '0 2px 6px rgba(255, 105, 180, 0.3)',
    opacity: '0.9',
  },
  {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    lineHeight: '50px',
    boxShadow: '0 3px 8px rgba(255, 105, 180, 0.4)',
    opacity: '0.9',
  },
  {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    lineHeight: '60px',
    boxShadow: '0 4px 10px rgba(255, 105, 180, 0.5)',
    opacity: '0.9',
  },
  {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '20px',
    lineHeight: '70px',
    boxShadow: '0 5px 12px rgba(255, 105, 180, 0.6)',
    opacity: '0.9',
  },
  {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '22px',
    lineHeight: '80px',
    boxShadow: '0 6px 14px rgba(255, 105, 180, 0.7)',
    opacity: '0.9',
  },
] as const;

/**
 * 클러스터러 기본 설정
 */
export const CLUSTERER_CONFIG = {
  averageCenter: true,
  minLevel: 4,
  disableClickZoom: true,
  minClusterSize: 3,
  gridSize: 60,
  calculator: [10, 30, 50, 100, 200] as number[],
};
