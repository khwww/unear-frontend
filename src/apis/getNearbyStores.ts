import axiosInstance from './axiosInstance';

export const getNearbyStores = async (latitude: number, longitude: number) => {
  try {
    console.log('🔍 getNearbyStores API 호출:', { latitude, longitude });
    const res = await axiosInstance.get('/places/nearby-with-coupons', {
      params: { latitude, longitude },
    });

    console.log('🔍 getNearbyStores API 응답:', res.data);
    const result = res.data?.data || [];
    console.log('🔍 getNearbyStores 반환값:', result, 'isArray:', Array.isArray(result));
    return result;
  } catch (error) {
    console.error('❌ 주변 매장 조회 실패:', error);
    return [];
  }
};
