import { useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import LoadingScreen from '@/components/common/LoadingScreen';
import EventBanner from '@/components/junior/EventBanner';
import JuniorMap from '@/components/junior/JuniorMap';
import JuniorMarket from '@/components/junior/JuniorMarket';
import { getStampsStatus } from '@/apis/stamp';

// Stamp 타입은 사용하지 않음 (UI에서 제거됨)

const JuniorPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentEventId = 2;

  // 이벤트 데이터 로드하는 함수
  const fetchEventData = async () => {
    const token = sessionStorage.getItem('temp_access_token');
    setIsLoading(true);
    if (!token) {
      setError('로그인이 필요한 서비스입니다.');
      setIsLoading(false);
      return;
    }

    try {
      // 스탬프 데이터는 로드하지만 사용하지 않음 (UI에서 제거됨)
      await getStampsStatus(currentEventId);
    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [currentEventId]);

  if (isLoading) {
    return (
      <>
        <Header title="이번주니어" />
        <div className="w-full max-w-[600px] mx-auto">
          <LoadingScreen
            fullHeight={false}
            message="이벤트 정보를 불러오는 중입니다..."
            size="md"
          />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="이번주니어" />
        <div className="w-full max-w-[600px] mx-auto">
          <div className="p-10 text-center text-red-500">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="이번주니어" />
      <div className="w-full max-w-[600px] mx-auto flex flex-col items-center">
        <EventBanner />
        <div className="flex flex-col gap-3 items-center w-full">
          <JuniorMap />
          <JuniorMarket />
        </div>
      </div>
    </>
  );
};

export default JuniorPage;
