'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PhoneDisplay from '@/components/phone-input/PhoneDisplay';
import NumericKeypad from '@/components/phone-input/NumericKeypad';
import { addDigit, removeLastDigit, isValidPhoneNumber } from '@/utils/phoneValidator';
import { fadeInUp, scaleIn } from '@/utils/animations';
import { sendPhoneNumberToWebhook } from '@/utils/webhook';

/**
 * Phone Input Page
 * Main page for entering phone number with Liquid Glass UI
 */
export default function PhoneInputPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleNumberPress = (digit: string) => {
    setPhoneNumber((prev) => addDigit(prev, digit));
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => removeLastDigit(prev));
  };

  const handleNext = async () => {
    if (!isValidPhoneNumber(phoneNumber) || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Store phone number in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userPhoneNumber', phoneNumber);
      }

      // Send phone number to make.com webhook
      const webhookSuccess = await sendPhoneNumberToWebhook(phoneNumber);
      
      if (webhookSuccess) {
        console.log('✅ Phone number sent to webhook successfully:', phoneNumber);
      } else {
        console.warn('⚠️ Webhook failed, but continuing with local storage');
      }

      // Navigate to voice test page
      console.log('🎤 Navigating to voice test page...');
      router.push('/voice-test');

    } catch (error) {
      console.error('❌ Error in handleNext:', error);
      alert(`오류가 발생했습니다. 다시 시도해주세요.\n\n전화번호: ${phoneNumber}`);
      setIsSubmitting(false);
    }
  };

  const isValid = isValidPhoneNumber(phoneNumber);

  return (
    <div className="min-h-screen glass-backdrop flex flex-col items-center justify-center p-0.5 relative overflow-y-auto">
      {/* Main content */}
      <div className="w-full max-w-[120px] mx-auto flex flex-col items-center space-y-0.5 py-2">
        
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center space-y-0.5"
        >
          <h1 className="text-[10px] font-medium text-gray-900 dark:text-gray-100 text-center font-display leading-tight">
            AI 면접
          </h1>
          <p className="text-[8px] text-gray-600 dark:text-gray-400 text-center font-medium opacity-70">
            연락처 입력
          </p>
        </motion.div>

        {/* Phone Display */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="w-full flex justify-center"
        >
          <PhoneDisplay phoneNumber={phoneNumber} />
        </motion.div>

        {/* Numeric Keypad */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          <NumericKeypad
            onNumberPress={handleNumberPress}
            onBackspace={handleBackspace}
          />
        </motion.div>

        {/* Next Button */}
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="w-full max-w-[100px] mx-auto"
        >
          <button
            onClick={handleNext}
            disabled={!isValid || isSubmitting}
            className={`
              glass-button-primary
              w-full py-0.5 px-1
              text-[8px] font-semibold text-white
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-1 focus:ring-purple-400 focus:ring-opacity-30
              rounded-md
              min-h-[16px]
              ${!isValid || isSubmitting 
                ? 'opacity-50 cursor-not-allowed transform-none' 
                : 'hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
            aria-label={isSubmitting ? '전송 중...' : '다음 단계로 이동'}
          >
            {isSubmitting 
              ? (
                <div className="flex items-center justify-center space-x-0.5">
                  <div className="w-1.5 h-1.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>전송 중...</span>
                </div>
              )
              : isValid 
                ? (
                  <div className="flex items-center justify-center space-x-0.5">
                    <span>확인</span>
                    <svg className="w-1.5 h-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )
                : '전화번호 입력'
            }
          </button>
        </motion.div>


      </div>

    </div>
  );
}

