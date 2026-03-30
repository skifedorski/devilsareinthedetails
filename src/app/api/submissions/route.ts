import { NextResponse } from 'next/server';
import type { SubmissionPayload, SubmissionResponse } from '@/types/submission';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function validatePayload(payload: Partial<SubmissionPayload>): string | null {
  if (!payload.message || typeof payload.message !== 'string' || payload.message.trim().length === 0) {
    return 'Message is required.';
  }

  if (typeof payload.isAnonymous !== 'boolean') {
    return 'isAnonymous must be a boolean.';
  }

  if (typeof payload.wantsFeedback !== 'boolean') {
    return 'wantsFeedback must be a boolean.';
  }

  if (payload.source !== 'website-v2') {
    return 'Invalid submission source.';
  }

  if (payload.wantsFeedback) {
    const email = payload.email?.trim();
    if (!email || !EMAIL_REGEX.test(email)) {
      return 'Valid email is required when feedback is requested.';
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SubmissionPayload>;
    const validationError = validatePayload(body);

    if (validationError) {
      const response: SubmissionResponse = { success: false, error: validationError };
      return NextResponse.json(response, { status: 400 });
    }

    const sanitizedPayload: SubmissionPayload = {
      message: body.message!.trim(),
      isAnonymous: body.isAnonymous!,
      wantsFeedback: body.wantsFeedback!,
      email: body.wantsFeedback ? body.email!.trim() : '',
      source: 'website-v2',
    };

    // Website V2 backend entrypoint: validated payload is ready for persistence/routing.
    // Keeping this minimal so storage provider can be swapped without touching UI code.
    console.info('Website V2 submission received:', {
      source: sanitizedPayload.source,
      isAnonymous: sanitizedPayload.isAnonymous,
      wantsFeedback: sanitizedPayload.wantsFeedback,
      hasEmail: Boolean(sanitizedPayload.email),
      messageLength: sanitizedPayload.message.length,
    });

    const response: SubmissionResponse = { success: true };
    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: SubmissionResponse = {
      success: false,
      error: 'The mirror stayed silent. Try again.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
