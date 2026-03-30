import type { SubmissionPayload, SubmissionResponse } from '@/types/submission';

const SUBMISSIONS_ENDPOINT = '/api/submissions';

export async function submitWebsiteV2Submission(
  payload: SubmissionPayload
): Promise<SubmissionResponse> {
  try {
    const response = await fetch(SUBMISSIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as SubmissionResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data.success ? 'Submission failed.' : data.error || 'Submission failed.',
      };
    }

    return data.success ? data : { success: true };
  } catch {
    return {
      success: false,
      error: 'The connection severed. Try again.',
    };
  }
}
