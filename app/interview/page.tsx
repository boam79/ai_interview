'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Simple Interview로 리다이렉트하는 페이지
export default function InterviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Simple Interview 페이지로 리다이렉트
    router.replace('/simple-interview');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-2xl font-bold text-gray-800">면접 페이지로 이동 중...</h1>
        </div>
        <p className="text-gray-600">더 안정적인 면접 시스템으로 이동합니다.</p>
      </motion.div>
    </div>
  );
}