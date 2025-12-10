import axiosInstance from './axiosInstance';
import type { CouponStatusCode } from '@/types/coupon';

interface DownloadCouponResponse {
  userCouponId: string;
  userId: string;
  couponTemplateId: string;
  couponStatusCode: CouponStatusCode;
  barcodeNumber: string;
  createdAt: string;
  usedAt: string | null;
  couponName: string | null;
  couponEnd: string | null;
  name: string | null;
  categoryCode: string | null;
  markerCode: string | null;
}

/**
 * 쿠폰 다운로드 API
 * @param couponTemplateId - 쿠폰 템플릿 ID (string)
 */
export const postDownloadCoupon = async (
  couponTemplateId: string
): Promise<DownloadCouponResponse> => {
  const response = await axiosInstance.post(`/coupons/${couponTemplateId}/download`);
  return response.data.data;
};
