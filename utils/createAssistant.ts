/**
 * OpenAI Assistant 생성 유틸리티
 * 새로운 면접 Assistant를 생성합니다.
 */

import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 면접용 Assistant 생성
 */
export async function createInterviewAssistant(): Promise<string> {
  try {
    console.log('[CreateAssistant] 면접 Assistant 생성 시작...');
    
    const assistant = await openai.beta.assistants.create({
      name: 'AI 면접관',
      instructions: `당신은 전문적인 AI 면접관입니다. 

다음과 같은 역할을 수행해주세요:

1. **면접 진행 방식:**
   - 총 5개의 질문을 순차적으로 진행
   - 각 질문은 1-2분 정도 답변할 수 있는 수준
   - 면접자의 답변을 듣고 적절한 후속 질문이나 피드백 제공

2. **질문 유형:**
   - 자기소개 및 경력 관련 질문
   - 업무 역량 및 경험 관련 질문
   - 문제 해결 능력 및 사고 과정 질문
   - 팀워크 및 커뮤니케이션 관련 질문
   - 지원 동기 및 목표 관련 질문

3. **면접 태도:**
   - 친근하고 전문적인 톤
   - 면접자의 답변을 경청하고 긍정적으로 평가
   - 구체적인 예시나 경험을 요청
   - 면접자의 긴장을 완화시키는 분위기 조성

4. **면접 종료:**
   - 5번째 질문 완료 후 면접을 정중하게 종료
   - 면접자에게 수고했다고 격려
   - 간단한 마무리 인사

5. **언어:**
   - 모든 질문과 응답은 한국어로 진행
   - 정중하고 존댓말 사용

첫 번째 질문을 시작해주세요.`,
      model: 'gpt-4o',
      tools: [],
    });
    
    console.log('[CreateAssistant] Assistant 생성 완료:', assistant.id);
    console.log('[CreateAssistant] Assistant 이름:', assistant.name);
    
    return assistant.id;
    
  } catch (error) {
    console.error('[CreateAssistant] Assistant 생성 실패:', error);
    throw new Error('Assistant 생성에 실패했습니다.');
  }
}

/**
 * 기존 Assistant 목록 조회
 */
export async function listAssistants(): Promise<any[]> {
  try {
    console.log('[CreateAssistant] Assistant 목록 조회...');
    
    const assistants = await openai.beta.assistants.list({
      limit: 20,
    });
    
    console.log(`[CreateAssistant] ${assistants.data.length}개의 Assistant 발견`);
    
    return assistants.data;
    
  } catch (error) {
    console.error('[CreateAssistant] Assistant 목록 조회 실패:', error);
    throw new Error('Assistant 목록 조회에 실패했습니다.');
  }
}

/**
 * Assistant 삭제
 */
export async function deleteAssistant(assistantId: string): Promise<void> {
  try {
    console.log('[CreateAssistant] Assistant 삭제:', assistantId);
    
    await openai.beta.assistants.del(assistantId);
    
    console.log('[CreateAssistant] Assistant 삭제 완료');
    
  } catch (error) {
    console.error('[CreateAssistant] Assistant 삭제 실패:', error);
    throw new Error('Assistant 삭제에 실패했습니다.');
  }
}
