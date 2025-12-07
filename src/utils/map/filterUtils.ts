/**
 * 지도 필터 관련 localStorage 키
 */
const FILTER_KEYS = {
  IS_BOOKMARK_ONLY: 'isBookmarkOnly',
  CATEGORY_CODES: 'categoryCodes',
  BENEFIT_CATEGORIES: 'benefitCategories',
} as const;

export interface MapFilterState {
  isBookmarkOnly: boolean;
  categoryCodes: string[];
  benefitCategories: string[];
}

/**
 * localStorage에서 지도 필터 상태 가져오기
 */
export const getStoredFilterState = (): MapFilterState => {
  const storedIsBookmarkOnly = localStorage.getItem(FILTER_KEYS.IS_BOOKMARK_ONLY);
  const storedCategoryCodes = localStorage.getItem(FILTER_KEYS.CATEGORY_CODES);
  const storedBenefitCategories = localStorage.getItem(FILTER_KEYS.BENEFIT_CATEGORIES);

  return {
    isBookmarkOnly: storedIsBookmarkOnly ? JSON.parse(storedIsBookmarkOnly) : false,
    categoryCodes: storedCategoryCodes ? JSON.parse(storedCategoryCodes) : [],
    benefitCategories: storedBenefitCategories ? JSON.parse(storedBenefitCategories) : [],
  };
};

/**
 * 필터 관련 storage 이벤트인지 확인
 */
export const isFilterStorageEvent = (key: string | null): boolean => {
  return (
    key === FILTER_KEYS.IS_BOOKMARK_ONLY ||
    key === FILTER_KEYS.CATEGORY_CODES ||
    key === FILTER_KEYS.BENEFIT_CATEGORIES
  );
};
