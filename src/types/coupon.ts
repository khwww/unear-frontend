// 쿠폰 관련 타입 정의
export interface CouponItem {
  id: string;
  brand: string;
  title: string;
  discountRate: string;
  validUntil: string;
  category: CategoryType;
  storeClass: StoreClassType;
  barcodeValue: string;
  usageCondition: string;
  usageGuide: string[];
  caution: string[];
  isExpiringSoon?: boolean;
}

export interface CouponData {
  expiringSoonCoupons: CouponItem[];
  allCoupons: CouponItem[];
  totalCount: number;
}

export type CategoryType =
  | 'FOOD'
  | 'ACTIVITY'
  | 'EDUCATION'
  | 'CULTURE'
  | 'BAKERY'
  | 'LIFE'
  | 'SHOPPING'
  | 'CAFE'
  | 'BEAUTY'
  | 'POPUP';

export type StoreClassType = 'LOCAL' | 'FRANCHISE' | 'BASIC';

export interface CouponPageHandlers {
  onCouponClick: (coupon: CouponItem) => void;
  onBack: () => void;
}

// 쿠폰 상태 코드 (API 명세 기준)
export type CouponStatusCode = 'AVAILABLE' | 'UNUSED' | 'USED' | 'EXPIRED';

export interface UserCoupon {
  userCouponId: string;
  userId: string;
  couponTemplateId: string;
  couponStatusCode: CouponStatusCode;
  barcodeNumber: string;
  createdAt: string;
  usedAt: string | null;
  couponName: string;
  couponEnd: string;
  name: string; // 브랜드명
  categoryCode: CategoryType;
  markerCode: StoreClassType;
}

export interface UserCouponDetail {
  userCouponId: string;
  userId: string;
  couponTemplateId: string;
  couponStatusCode: CouponStatusCode;
  barcodeNumber: string;
  createdAt: string;
  usedAt: string | null;
  couponName: string;
  couponEnd: string;
  name: string; // 브랜드명
  brandName?: string; // 브랜드명 (레거시 호환)
  categoryCode: CategoryType;
  markerCode: StoreClassType;
  // 할인 관련 필드 (실제 사용 중)
  discountCode?: 'COUPON_PERCENT' | 'COUPON_FIXED';
  discountPercent?: number;
  fixedDiscount?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
}

// 장소별 쿠폰 조회 응답 타입 (GET /coupons/{placeId})
export interface PlaceCoupon {
  couponTemplateId: string;
  couponName: string;
  remainingQuantity: number; // -1: 무제한
  couponStart: string;
  couponEnd: string;
  discountCode: string;
  membershipCode: string;
  markerCode: string;
  isDeleted: boolean;
  unearEventId: string;
  placeId: string;
}
