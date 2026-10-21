/** Keep transport failures distinct from errors returned by the provider. */
export function coachErrorMessage(error:unknown,origin=''){
 const message=error instanceof Error?error.message:String(error||'');
 if((error instanceof Error&&error.name==='AbortError')||/aborted|timed? out|timeout/i.test(message))return 'The AI request timed out. Your draft is saved. Retry when the connection is available.';
 if(/failed to fetch|networkerror|load failed/i.test(message))return `The browser could not reach the AI service${origin?' from '+origin:''}. Check the connection and the Supabase function’s allowed origins (COACH_ALLOWED_ORIGINS or COACH_DEV_ORIGINS), then retry. Your draft is saved.`;
 return message.slice(0,1000)||'AI request failed. Your draft is saved; please retry.';
}
