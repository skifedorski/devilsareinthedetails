export type SubmissionSource = 'website-v2';

export interface SubmissionPayload {
  message: string;
  isAnonymous: boolean;
  wantsFeedback: boolean;
  email: string;
  source: SubmissionSource;
}

export interface SubmissionSuccessResponse {
  success: true;
}

export interface SubmissionErrorResponse {
  success: false;
  error: string;
}

export type SubmissionResponse = SubmissionSuccessResponse | SubmissionErrorResponse;
