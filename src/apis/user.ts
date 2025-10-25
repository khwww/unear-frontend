// import axiosInstance from './axiosInstance'; // 사용하지 않으므로 주석 처리

// 백엔드 스웨거 User 객체에서 필요한 부분만 타입으로 정의
interface RouletteResult {
  id: number;
  event: {
    unearEventId: number;
  };
  participated: boolean;
}

export interface User {
  userId: number;
  username: string;
  rouletteResults?: RouletteResult[];
}

// getUserInfo 함수는 userInfo.ts에서 관리됩니다.
// 중복을 피하기 위해 이 파일에서는 제거했습니다.
