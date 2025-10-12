'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidPhoneNumber, addDigit, removeLastDigit } from '@/utils/phoneValidator';

interface PhoneKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phoneNumber: string) => void;
  initialValue?: string;
}

export default function PhoneKeypadModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialValue = '' 
}: PhoneKeypadModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialValue);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(initialValue);
      setIsValid(isValidPhoneNumber(initialValue));
    }
  }, [isOpen, initialValue]);

  const handleDigitClick = (digit: string) => {
    const newPhone = addDigit(phoneNumber, digit);
    setPhoneNumber(newPhone);
    setIsValid(isValidPhoneNumber(newPhone));
  };

  const handleBackspace = () => {
    const newPhone = removeLastDigit(phoneNumber);
    setPhoneNumber(newPhone);
    setIsValid(isValidPhoneNumber(newPhone));
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(phoneNumber);
      onClose();
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
    setIsValid(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card p-2 rounded-lg w-full max-w-[280px] pointer-events-auto
              bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl overflow-y-auto max-h-[85vh] mx-2">
              
              {/* Header */}
              <div className="text-center mb-2">
                <h2 className="text-sm font-medium text-gray-800 mb-1">전화번호 입력</h2>
                <p className="text-[10px] text-gray-600">숫자 키패드를 사용하여 입력해주세요</p>
              </div>

              {/* Phone Display */}
              <div className="mb-2">
                <div className="bg-gray-50 rounded-md p-2 border border-gray-200 focus-within:border-blue-500 transition-colors">
                  <input
                    type="tel"
                    value={phoneNumber}
                    readOnly
                    className="w-full text-center text-sm font-mono bg-transparent border-none outline-none text-gray-800"
                    placeholder="010-0000-0000"
                  />
                </div>
                
                {/* Validation Status */}
                <div className="mt-1 text-center">
                  {phoneNumber && (
                    <div className={`text-[9px] font-medium ${
                      isValid ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {isValid ? '✓ 올바름' : '올바른 형식 입력'}
                    </div>
                  )}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <motion.button
                    key={key}
                    onClick={() => handleDigitClick(key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square bg-white border border-gray-200 rounded-md font-semibold text-xs text-gray-800 hover:bg-gray-50 transition-colors shadow-sm min-h-[32px]"
                  >
                    {key}
                  </motion.button>
                ))}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1 mb-2">
                <motion.button
                  onClick={handleBackspace}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-1 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1 min-h-[28px]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                  <span className="text-[9px]">삭제</span>
                </motion.button>
                
                <motion.button
                  onClick={handleClear}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-1 bg-red-100 text-red-700 rounded-md font-semibold hover:bg-red-200 transition-colors min-h-[28px]"
                >
                  <span className="text-[9px]">전체 삭제</span>
                </motion.button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-1 bg-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-400 transition-colors min-h-[28px]"
                >
                  <span className="text-[10px]">취소</span>
                </motion.button>
                
                <motion.button
                  onClick={handleConfirm}
                  disabled={!isValid}
                  whileHover={{ scale: isValid ? 1.05 : 1 }}
                  whileTap={{ scale: isValid ? 0.95 : 1 }}
                  className={`flex-1 py-1 rounded-md font-semibold transition-all duration-200 min-h-[28px] ${
                    isValid
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px]">확인</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
