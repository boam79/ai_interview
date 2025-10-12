/**
 * OpenAI Assistants API 유틸리티
 * Thread 생성, 메시지 추가, Run 생성 및 폴링 기능 제공
 */

import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (서버 사이드에서만 사용)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 새로운 Thread 생성
 * @returns Thread ID
 */
export async function createThread(): Promise<string> {
  try {
    console.log('[AssistantAPI] Thread 생성 시작...');
    const thread = await openai.beta.threads.create();
    console.log('[AssistantAPI] Thread 생성 완료:', thread.id);
    return thread.id;
  } catch (error) {
    console.error('[AssistantAPI] Thread 생성 실패:', error);
    throw new Error('Thread 생성에 실패했습니다.');
  }
}

/**
 * Thread에 메시지 추가
 * @param threadId - Thread ID
 * @param content - 메시지 내용
 * @param role - 메시지 역할 (기본: user)
 */
export async function addMessage(
  threadId: string,
  content: string,
  role: 'user' | 'assistant' = 'user'
): Promise<void> {
  try {
    console.log(`[AssistantAPI] 메시지 추가 - Thread: ${threadId}, Role: ${role}`);
    console.log(`[AssistantAPI] 내용: ${content.substring(0, 100)}...`);
    
    await openai.beta.threads.messages.create(threadId, {
      role,
      content,
    });
    
    console.log('[AssistantAPI] 메시지 추가 완료');
  } catch (error) {
    console.error('[AssistantAPI] 메시지 추가 실패:', error);
    throw new Error('메시지 추가에 실패했습니다.');
  }
}

/**
 * Run 생성 및 실행
 * @param threadId - Thread ID
 * @param assistantId - Assistant ID
 * @returns Run ID
 */
export async function createRun(
  threadId: string,
  assistantId: string
): Promise<string> {
  try {
    console.log(`[AssistantAPI] Run 생성 시작 - Thread: ${threadId}, Assistant: ${assistantId}`);
    
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    
    // Assistant ID 확인
    if (!assistantId) {
      throw new Error('Assistant ID가 제공되지 않았습니다.');
    }
    
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    
    console.log('[AssistantAPI] Run 생성 완료:', run.id);
    console.log('[AssistantAPI] Run 상태:', run.status);
    
    if (!run.id) {
      throw new Error('Run ID가 반환되지 않았습니다.');
    }
    
    return run.id;
  } catch (error: any) {
    console.error('[AssistantAPI] Run 생성 실패 - 상세 오류:');
    console.error('  - 오류 타입:', error.constructor.name);
    console.error('  - 오류 메시지:', error.message);
    console.error('  - HTTP 상태:', error.status);
    console.error('  - 응답 헤더:', error.headers);
    console.error('  - 요청 ID:', error.requestID);
    console.error('  - 전체 오류 객체:', error);
    
    // 구체적인 오류 메시지 제공
    if (error.status === 404) {
      throw new Error(`Assistant를 찾을 수 없습니다 (ID: ${assistantId}). Assistant가 존재하는지 확인해주세요.`);
    } else if (error.status === 401) {
      throw new Error('OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.');
    } else if (error.status === 429) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      throw new Error(`Run 생성 실패: ${error.message || '알 수 없는 오류'}`);
    }
  }
}

/**
 * Run 상태 조회
 * @param threadId - Thread ID
 * @param runId - Run ID
 * @returns Run 상태
 */
export async function getRunStatus(
  threadId: string,
  runId: string
): Promise<string> {
  try {
    // 파라미터 검증
    if (!threadId || threadId === 'undefined') {
      throw new Error(`유효하지 않은 Thread ID: ${threadId}`);
    }
    if (!runId || runId === 'undefined') {
      throw new Error(`유효하지 않은 Run ID: ${runId}`);
    }
    
    console.log(`[AssistantAPI] Run 상태 조회 - Thread: ${threadId}, Run: ${runId}`);
    
    // OpenAI SDK 파라미터: runs.retrieve(runId, { thread_id })
    const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
    console.log(`[AssistantAPI] Run 상태 상세 정보:`);
    console.log(`  - Run ID: ${run.id}`);
    console.log(`  - 상태: ${run.status}`);
    console.log(`  - Assistant ID: ${run.assistant_id}`);
    console.log(`  - 생성 시간: ${run.created_at}`);
    console.log(`  - 완료 시간: ${run.completed_at || '미완료'}`);
    console.log(`  - 만료 시간: ${run.expires_at || '만료 없음'}`);
    
    // 오류 정보가 있으면 로깅
    if (run.last_error) {
      console.error(`[AssistantAPI] Run 오류 정보:`, run.last_error);
    }
    
    return run.status;
  } catch (error) {
    console.error('[AssistantAPI] Run 상태 조회 실패:', error);
    throw new Error('Run 상태 조회에 실패했습니다.');
  }
}

/**
 * Run 완료까지 폴링
 * @param threadId - Thread ID
 * @param runId - Run ID
 * @param maxWaitTime - 최대 대기 시간 (밀리초, 기본: 30초)
 * @returns Run 완료 여부
 */
export async function pollRunStatus(
  threadId: string,
  runId: string,
  maxWaitTime: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2초마다 폴링 (더 안정적)
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;
  
  console.log(`[AssistantAPI] Run 폴링 시작 - Thread: ${threadId}, Run: ${runId}`);
  console.log(`[AssistantAPI] 최대 대기 시간: ${maxWaitTime}ms`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      console.log(`[AssistantAPI] getRunStatus 호출 - Thread: "${threadId}", Run: "${runId}"`);
      const status = await getRunStatus(threadId, runId);
      const elapsed = Date.now() - startTime;
      console.log(`[AssistantAPI] Run 상태: ${status} (경과: ${elapsed}ms)`);
      
      // 연속 오류 카운터 리셋
      consecutiveErrors = 0;
      
      if (status === 'completed') {
        console.log(`[AssistantAPI] Run 완료! 총 소요 시간: ${elapsed}ms`);
        return true;
      }
      
      if (status === 'failed' || status === 'cancelled' || status === 'expired') {
        console.error(`[AssistantAPI] Run 실패 - 상태: ${status}, 경과: ${elapsed}ms`);
        
        // failed 상태의 경우 더 자세한 정보 수집
        if (status === 'failed') {
          try {
            const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
            if (run.last_error) {
              console.error(`[AssistantAPI] Run last_error:`, run.last_error);
              
              // OpenAI 서버 오류인 경우 구체적인 메시지 제공
              if (run.last_error.code === 'server_error') {
                throw new Error(`OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (오류 코드: ${run.last_error.code})`);
              } else {
                throw new Error(`OpenAI Assistant 오류: ${run.last_error.message} (코드: ${run.last_error.code})`);
              }
            }
          } catch (detailError: unknown) {
            console.error(`[AssistantAPI] 실패 상세 정보 조회 실패:`, detailError);
            // 이미 위에서 throw한 오류를 다시 전파
            if (detailError instanceof Error && 
                (detailError.message.includes('OpenAI 서버 오류') || 
                 detailError.message.includes('OpenAI Assistant 오류'))) {
              throw detailError; // 구체적인 오류 메시지 재전파
            }
          }
        }
        
        return false;
      }
      
      // 2초 대기
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      consecutiveErrors++;
      const elapsed = Date.now() - startTime;
      console.error(`[AssistantAPI] 폴링 중 오류 (경과: ${elapsed}ms, 연속 오류: ${consecutiveErrors}):`, error);
      
      // 연속 오류가 너무 많으면 중단
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`[AssistantAPI] 연속 오류 ${maxConsecutiveErrors}회로 폴링 중단`);
        return false;
      }
      
      // 오류 발생 시 더 긴 대기 시간
      await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
    }
  }
  
  console.error(`[AssistantAPI] Run 타임아웃 - ${maxWaitTime}ms 초과`);
  return false;
}

/**
 * Thread의 메시지 목록 조회
 * @param threadId - Thread ID
 * @returns 메시지 목록
 */
export async function getMessages(threadId: string) {
  try {
    console.log(`[AssistantAPI] 메시지 목록 조회 - Thread: ${threadId}`);
    
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 20,
    });
    
    console.log(`[AssistantAPI] 메시지 ${messages.data.length}개 조회됨`);
    return messages.data;
    
  } catch (error) {
    console.error('[AssistantAPI] 메시지 조회 실패:', error);
    throw new Error('메시지 조회에 실패했습니다.');
  }
}

/**
 * 가장 최근 Assistant 메시지 추출
 * @param threadId - Thread ID
 * @returns Assistant의 최신 메시지 내용
 */
export async function getLatestAssistantMessage(
  threadId: string
): Promise<string | null> {
  try {
    const messages = await getMessages(threadId);
    
    // 최신 assistant 메시지 찾기
    const assistantMessage = messages.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      console.log('[AssistantAPI] Assistant 메시지가 없습니다.');
      return null;
    }
    
    // 메시지 내용 추출
    const content = assistantMessage.content[0];
    if (content.type === 'text') {
      const text = content.text.value;
      console.log(`[AssistantAPI] Assistant 메시지: ${text.substring(0, 100)}...`);
      return text;
    }
    
    return null;
    
  } catch (error) {
    console.error('[AssistantAPI] 최신 메시지 추출 실패:', error);
    throw new Error('최신 메시지 추출에 실패했습니다.');
  }
}

/**
 * Thread 삭제 (옵션)
 * @param threadId - Thread ID
 */
export async function deleteThread(threadId: string): Promise<void> {
  try {
    console.log(`[AssistantAPI] Thread 삭제 - ${threadId}`);
    await openai.beta.threads.delete(threadId);
    console.log('[AssistantAPI] Thread 삭제 완료');
  } catch (error) {
    console.error('[AssistantAPI] Thread 삭제 실패:', error);
    // 삭제 실패는 심각한 오류가 아니므로 throw하지 않음
  }
}

/**
 * 면접 시작 헬퍼 함수
 * Thread 생성 + 초기 메시지 추가 + Run 생성 + 응답 대기
 * @param assistantId - Assistant ID
 * @param initialMessage - 초기 메시지 (옵션)
 * @returns { threadId, firstQuestion }
 */
export async function startInterview(
  assistantId: string,
  initialMessage?: string
): Promise<{ threadId: string; firstQuestion: string | null }> {
  try {
    // 1. Thread 생성
    const threadId = await createThread();
    
    // 2. 초기 메시지 추가 (있는 경우)
    if (initialMessage) {
      await addMessage(threadId, initialMessage);
    }
    
    // 3. Run 생성
    console.log(`[AssistantAPI] Run 생성 시작 - Thread: ${threadId}, Assistant: ${assistantId}`);
    const runId = await createRun(threadId, assistantId);
    console.log(`[AssistantAPI] Run 생성 완료 - Run ID: ${runId}`);
    
    // Run ID 검증
    if (!runId) {
      throw new Error('Run ID가 생성되지 않았습니다.');
    }
    
    // 4. Run 완료 대기 (120초로 연장, 재시도 로직 포함)
    const maxRetries = 3; // 재시도 횟수 증가
    let isCompleted = false;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[AssistantAPI] Run 완료 대기 시도 ${attempt}/${maxRetries}`);
      console.log(`[AssistantAPI] pollRunStatus 호출 - Thread: "${threadId}", Run: "${runId}"`);
      
      try {
        isCompleted = await pollRunStatus(threadId, runId, 120000); // 120초
        
        if (isCompleted) {
          break;
        }
      } catch (error) {
        lastError = error;
        console.log(`[AssistantAPI] 시도 ${attempt} 실패:`, error.message);
      }
      
      if (attempt < maxRetries) {
        const retryDelay = attempt * 3000; // 점진적 지연 (3초, 6초)
        console.log(`[AssistantAPI] ${retryDelay/1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    if (!isCompleted) {
      if (lastError) {
        throw lastError; // 구체적인 오류 메시지 전파
      } else {
        throw new Error('AI 응답 대기 시간 초과 (120초, 3회 재시도)');
      }
    }
    
    // 5. 첫 질문 추출
    const firstQuestion = await getLatestAssistantMessage(threadId);
    
    return { threadId, firstQuestion };
    
  } catch (error) {
    console.error('[AssistantAPI] 면접 시작 실패:', error);
    throw error;
  }
}

/**
 * 답변 제출 및 다음 질문 받기
 * @param threadId - Thread ID
 * @param assistantId - Assistant ID
 * @param answer - 사용자 답변
 * @returns 다음 질문
 */
export async function submitAnswerAndGetNextQuestion(
  threadId: string,
  assistantId: string,
  answer: string
): Promise<string | null> {
  try {
    // 1. 답변 메시지 추가
    await addMessage(threadId, answer);
    
    // 2. Run 생성
    const runId = await createRun(threadId, assistantId);
    
    // 3. Run 완료 대기 (120초로 연장, 재시도 로직 포함)
    const maxRetries = 2;
    let isCompleted = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[AssistantAPI] 답변 Run 완료 대기 시도 ${attempt}/${maxRetries}`);
      
      isCompleted = await pollRunStatus(threadId, runId, 120000); // 120초
      
      if (isCompleted) {
        break;
      }
      
      if (attempt < maxRetries) {
        console.log(`[AssistantAPI] 답변 시도 ${attempt} 실패, 5초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (!isCompleted) {
      throw new Error('AI 응답 대기 시간 초과 (120초, 2회 재시도)');
    }
    
    // 4. 다음 질문 추출
    const nextQuestion = await getLatestAssistantMessage(threadId);
    
    return nextQuestion;
    
  } catch (error) {
    console.error('[AssistantAPI] 답변 제출 실패:', error);
    throw error;
  }
}

/**
 * 면접 요약 요청
 * @param threadId - Thread ID
 * @param assistantId - Assistant ID
 * @returns 면접 요약 및 피드백
 */
export async function requestInterviewSummary(
  threadId: string,
  assistantId: string
): Promise<string | null> {
  try {
    // 요약 요청 메시지 추가
    await addMessage(
      threadId,
      '면접이 종료되었습니다. 지금까지의 면접 내용을 바탕으로 상세한 요약과 피드백을 제공해주세요. 강점, 개선점, 전반적인 평가를 포함해주세요.'
    );
    
    // Run 생성 및 대기 (120초, 재시도 로직 포함)
    const runId = await createRun(threadId, assistantId);
    const maxRetries = 2;
    let isCompleted = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[AssistantAPI] 요약 Run 완료 대기 시도 ${attempt}/${maxRetries}`);
      
      isCompleted = await pollRunStatus(threadId, runId, 120000); // 120초
      
      if (isCompleted) {
        break;
      }
      
      if (attempt < maxRetries) {
        console.log(`[AssistantAPI] 요약 시도 ${attempt} 실패, 5초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (!isCompleted) {
      throw new Error('요약 생성 시간 초과 (120초, 2회 재시도)');
    }
    
    // 요약 추출
    const summary = await getLatestAssistantMessage(threadId);
    
    return summary;
    
  } catch (error) {
    console.error('[AssistantAPI] 요약 요청 실패:', error);
    throw error;
  }
}

