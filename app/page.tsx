'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '@/utils/animations';
import { isValidPhoneNumber } from '@/utils/phoneValidator';
import PhoneKeypadModal from '@/components/phone-input/PhoneKeypadModal';

export default function HomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const handlePhoneInputClick = () => {
    setShowKeypad(true);
  };

  const handlePhoneConfirm = (confirmedPhone: string) => {
    setPhoneNumber(confirmedPhone);
    setIsValid(isValidPhoneNumber(confirmedPhone));
  };

  const handleStart = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    
    // 전화번호를 localStorage에 저장
    localStorage.setItem('phoneNumber', phoneNumber);
    
    // 음성 테스트 페이지로 이동
    setTimeout(() => {
      router.push('/voice-test-simple');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* 헤더 */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center mb-12"
        >
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-4"
          >
            1일 1바이브 코딩
          </motion.h1>
          <motion.h2 
            variants={fadeInUp}
            className="text-2xl md:text-4xl font-bold text-purple-600 mb-6"
          >
            30일 챌린지
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed"
          >
            AI 면접관과 함께하는 음성 면접 연습으로<br />
            당신의 면접 실력을 한 단계 업그레이드하세요
          </motion.p>
        </motion.div>

        {/* 메인 카드 */}
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="glass-card p-8 md:p-12 rounded-3xl text-center"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </motion.div>
            
            <motion.h3
              variants={fadeInUp}
              className="text-2xl font-bold text-gray-800 mb-4"
            >
              AI 음성 면접 시작하기
            </motion.h3>
            
            <motion.p
              variants={fadeInUp}
              className="text-gray-600 mb-8"
            >
              전화번호를 입력하고 음성 면접을 시작해보세요
            </motion.p>
          </div>

          {/* 전화번호 입력 */}
          <motion.div
            variants={fadeInUp}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <motion.button
                onClick={handlePhoneInputClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isValid === true
                    ? 'border-green-400 bg-green-50 hover:bg-green-100'
                    : isValid === false
                    ? 'border-red-400 bg-red-50 hover:bg-red-100'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-mono ${
                    phoneNumber ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {phoneNumber || '010-0000-0000'}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </motion.button>
              {isValid === false && (
                <p className="text-red-500 text-sm mt-2">
                  올바른 전화번호 형식이 아닙니다 (예: 010-0000-0000)
                </p>
              )}
              {isValid === true && (
                <p className="text-green-500 text-sm mt-2">
                  ✓ 올바른 전화번호 형식입니다
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                💡 전화번호를 클릭하면 키패드가 나타납니다
              </p>
            </div>

            <motion.button
              onClick={handleStart}
              disabled={!isValid || isLoading}
              whileHover={{ scale: isValid ? 1.05 : 1 }}
              whileTap={{ scale: isValid ? 0.95 : 1 }}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isValid && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>준비 중...</span>
                </div>
              ) : (
                '음성 면접 시작하기'
              )}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* 특징 설명 */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">음성 면접</h4>
            <p className="text-sm text-gray-600">실제 면접과 같은 음성 대화로 연습</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">AI 피드백</h4>
            <p className="text-sm text-gray-600">인공지능이 실시간으로 면접 피드백 제공</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">빠른 시작</h4>
            <p className="text-sm text-gray-600">간단한 설정으로 즉시 면접 연습 시작</p>
          </div>
        </motion.div>

        {/* Phone Keypad Modal */}
        <PhoneKeypadModal
          isOpen={showKeypad}
          onClose={() => setShowKeypad(false)}
          onConfirm={handlePhoneConfirm}
          initialValue={phoneNumber}
        />

      </div>
    </div>
  );
}