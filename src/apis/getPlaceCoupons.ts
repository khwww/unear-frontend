import axiosInstance from './axiosInstance';
import type { PlaceCoupon } from '@/types/coupon';

interface GetPlaceCouponsResponse {
  resultCode: number;
  codeName: string;
  message: string;
  data: PlaceCoupon[];
}

/**
 * 장소별 쿠폰 조회 API
 * @param placeId - 장소 ID
 * @returns 해당 장소에서 사용 가능한 쿠폰 목록
 */
export const getPlaceCoupons = async (placeId: string | number): Promise<PlaceCoupon[]> => {
  try {
    const response = await axiosInstance.get(`/coupons/${placeId}`);
    const responseData = response.data as GetPlaceCouponsResponse;

    console.log('🔍 getPlaceCoupons API Debug:');
    console.log('  - placeId:', placeId);
    console.log('  - response:', responseData);

    if (responseData.resultCode === 200 && responseData.data) {
      return responseData.data;
    }

    return [];
  } catch (error) {
    console.error('❌ getPlaceCoupons error:', error);
    return [];
  }
};
