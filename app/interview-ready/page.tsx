'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ChecklistCard from '@/components/interview/ChecklistCard';

// 체크리스트 데이터
const checklistItems = [
  {
    title: '조용한 환경 확보',
    description: [
      '주변 소음이 없는 공간',
      '방해받지 않을 시간 확보'
    ],
    icon: '🤫'
  },
  {
    title: '마이크 테스트 완료',
    description: [
      '음성이 명확하게 인식됨',
      '적절한 볼륨 확인'
    ],
    icon: '🎤'
  },
  {
    title: '면접 태도 준비',
    description: [
      '편안한 자세',
      '침착한 마음가짐'
    ],
    icon: '🧘'
  },
  {
    title: '자기소개 준비',
    description: [
      '핵심 경력 정리',
      '강점 및 동기 파악'
    ],
    icon: '💼'
  }
];

export default function InterviewReadyPage() {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(checklistItems.length).fill(false)
  );

  // 체크 상태 업데이트
  const handleCheck = (index: number, checked: boolean) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = checked;
    setCheckedItems(newCheckedItems);
  };

  // 모든 항목이 체크되었는지 확인
  const allChecked = checkedItems.every(item => item === true);

  // 면접 시작
  const handleStartInterview = () => {
    console.log('면접 시작!');
    router.push('/interview');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100">
      <div className="w-full max-w-xs sm:max-w-xl md:max-w-3xl lg:max-w-5xl">
        
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            면접 준비
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            다음 항목을 확인하고 체크해주세요
          </p>
        </motion.div>

        {/* 체크리스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
          {checklistItems.map((item, index) => (
            <ChecklistCard
              key={index}
              title={item.title}
              description={item.description}
              icon={item.icon}
              index={index}
              onCheck={(checked) => handleCheck(index, checked)}
            />
          ))}
        </div>

        {/* 진행 상태 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
            <div className="text-sm sm:text-base text-gray-600">
              {checkedItems.filter(item => item).length} / {checklistItems.length} 완료
            </div>
            <div className="flex-1 max-w-xs h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(checkedItems.filter(item => item).length / checklistItems.length) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>

        {/* 면접 시작 버튼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: allChecked ? 1 : 0.5, 
            scale: allChecked ? 1 : 0.95 
          }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleStartInterview}
            disabled={!allChecked}
            className={`
              px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5
              text-base sm:text-lg md:text-xl font-bold text-white
              rounded-2xl sm:rounded-3xl
              transition-all duration-300
              ${allChecked
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed opacity-50'
              }
              backdrop-blur-xl
              relative overflow-hidden
            `}
          >
            {/* 버튼 반사광 효과 */}
            {allChecked && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
            )}
            
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>면접 시작</span>
              <motion.span
                animate={{ x: allChecked ? [0, 5, 0] : 0 }}
                transition={{ 
                  repeat: allChecked ? Infinity : 0,
                  duration: 1.5
                }}
              >
                →
              </motion.span>
            </span>
          </button>

          {/* 안내 메시지 */}
          {!allChecked && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4"
            >
              모든 항목을 체크하면 면접을 시작할 수 있습니다
            </motion.p>
          )}
        </motion.div>

        {/* 팁 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 sm:mt-8 md:mt-10 p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20"
        >
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="text-xl sm:text-2xl">💡</div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1 sm:mb-2">
                면접 팁
              </h3>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• 각 질문에 대해 명확하고 간결하게 답변하세요</li>
                <li>• 구체적인 경험과 예시를 들어 설명하세요</li>
                <li>• 자신감 있고 긍정적인 태도를 유지하세요</li>
                <li>• 답변 전 잠시 생각할 시간을 가져도 됩니다</li>
              </ul>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

