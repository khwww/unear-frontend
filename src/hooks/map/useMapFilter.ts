import { useState, useEffect, useCallback } from 'react';

const ALL_CATEGORY_CODES = [
  'FOOD',
  'CAFE',
  'BAKERY',
  'LIFE',
  'ACTIVITY',
  'EDUCATION',
  'CULTURE',
  'SHOPPING',
  'CAFE',
  'BEAUTY',
];

const ALL_BENEFIT_CODES = ['할인', '적립', '무료서비스', '상품 증정'];

interface UseMapFilterReturn {
  isBookmarkOnly: boolean;
  categoryCodes: string[];
  benefitCategories: string[];
  setIsBookmarkOnly: (value: boolean) => void;
  setCategoryCodes: (codes: string[]) => void;
  setBenefitCategories: (categories: string[]) => void;
  toggleBookmark: () => void;
  applyFilter: (categories: string[], benefits: string[]) => void;
}

/**
 * 지도 필터 상태를 관리하는 훅
 * localStorage와 동기화됨
 */
export const useMapFilter = (): UseMapFilterReturn => {
  const [isBookmarkOnly, setIsBookmarkOnly] = useState<boolean>(() => {
    const stored = localStorage.getItem('isBookmarkOnly');
    return stored ? JSON.parse(stored) : false;
  });

  const [categoryCodes, setCategoryCodes] = useState<string[]>(() => {
    const stored = localStorage.getItem('categoryCodes');
    return stored ? JSON.parse(stored) : [];
  });

  const [benefitCategories, setBenefitCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem('benefitCategories');
    return stored ? JSON.parse(stored) : [];
  });

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem('isBookmarkOnly', JSON.stringify(isBookmarkOnly));
  }, [isBookmarkOnly]);

  useEffect(() => {
    if (categoryCodes.length === 0 || categoryCodes.length === ALL_CATEGORY_CODES.length) {
      localStorage.removeItem('categoryCodes');
    } else {
      localStorage.setItem('categoryCodes', JSON.stringify(categoryCodes));
    }
  }, [categoryCodes]);

  useEffect(() => {
    if (benefitCategories.length === 0 || benefitCategories.length === ALL_BENEFIT_CODES.length) {
      localStorage.removeItem('benefitCategories');
    } else {
      localStorage.setItem('benefitCategories', JSON.stringify(benefitCategories));
    }
  }, [benefitCategories]);

  const toggleBookmark = useCallback(() => {
    setIsBookmarkOnly((prev) => !prev);
  }, []);

  const applyFilter = useCallback((categories: string[], benefits: string[]) => {
    setCategoryCodes(categories);
    setBenefitCategories(benefits);
  }, []);

  return {
    isBookmarkOnly,
    categoryCodes,
    benefitCategories,
    setIsBookmarkOnly,
    setCategoryCodes,
    setBenefitCategories,
    toggleBookmark,
    applyFilter,
  };
};

export default useMapFilter;
