import axiosInstance from './axiosInstance';

export const getNearbyStores = async (latitude: number, longitude: number) => {
  try {
    const res = await axiosInstance.get('/places/nearby-with-coupons', {
      params: { latitude, longitude },
    });

    return res.data?.data || [];
  } catch (error) {
    console.error('주변 매장 조회 실패:', error);
    return [];
  }
};
