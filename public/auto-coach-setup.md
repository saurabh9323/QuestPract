# Quest90 Auto coach — one-time Gemini setup

The default coach needs no AI key. After a new saved submission, it creates a local
practice pack and saves it with your existing account progress. It does not grade
or execute your code. Supported algorithms get generated inputs and reference
traces; other topics get related authored stories or reflection scaffolds.

## Where to place your Gemini key

1. Create a Gemini API key in https://aistudio.google.com/apikey . Use a project
   without billing enabled if you want free-tier usage only. Availability and
   quotas depend on Google's current rules, account and region.
2. Open your Supabase project → **Edge Functions → Secrets**.
3. Add **Name: `GEMINI_API_KEY`**, **Value: your Gemini API key**, then Save.
4. Add another secret named **`COACH_ALLOWED_ORIGINS`**. Its value is a comma-separated
   list of your exact website origins, without trailing slashes. For this project:

   `https://questproj-rho.vercel.app,http://localhost:3012`

   Add your actual development port if it differs. Do not use `*`.

Do not put this key in chat, a public environment variable, the frontend code,
Supabase progress records, or Git. The browser never needs the Gemini key.
The Edge Function reads Supabase's injected URL and service credentials internally.

## Apply the database setup and deploy

Adding the secret alone does not deploy the function.

1. In Supabase SQL Editor, run the repository file
   `supabase/migrations/202610060001_auto_coach.sql`.
   It creates a private generation cache and an atomic quota function; it does not
   change or reset your existing learning history.
2. With the Supabase CLI installed and authenticated, run from the Quest90 repository:

   ```sh
   supabase login
   supabase link --project-ref xavuhmunsmiknusfskwr
   supabase functions deploy auto-coach --no-verify-jwt
   ```

   Substitute your project reference if using a different Supabase project.
   Gateway JWT checking is disabled because the handler itself verifies every
   bearer token with Supabase Auth before making any provider or database call.
   Do not remove that authentication check.
3. Publish the frontend changes through the normal Vercel Git deployment.
4. Sign in → **Practice → Auto coach**. Open a saved pack and select
   **Send this answer to Gemini** for the first request.
5. Once it works, enable **Send new submissions to Gemini automatically** on the
   Auto coach shelf. Local follow-ups must also remain enabled. Already-saved
   packs are not sent in bulk when you enable it.

## What happens after a submission

- Your original answer is saved first through the existing account save flow.
- A free local follow-up is created without calling an AI provider.
- If opted in, the browser sends its question, answer excerpt (up to 8,000
  characters), previous-answer excerpt (up to 2,000), topic and confidence to the
  authenticated Edge Function. The user ID comes from verified authentication,
  not from the request body.
- Gemini generates feedback, a challenge, example code and a bounded cartoon
  storyboard. The portal renders that storyboard using its existing animated
  player, narration and captioned video export. This is not a generative-video API.
- The AI result is validated and saved separately. Original answers and the local
  reference lesson remain unchanged. Generated code is displayed, never executed.
- Saving still uses the account sync indicator. Keep the app open for the result
  to be received and synced. A reload retries a pending request with the same ID;
  a completed cached result does not require another model call.

## Limits, data and reference fetching

The function uses `gemini-3.5-flash-lite`. It makes no paid-model fallback and no
automatic retry loop. App limits are **10 reserved requests per account and 100
per project per UTC day**, including failed requests. Provider limits can be lower.
The app cannot force a billing-enabled Google project to be free; check AI Studio.

Free-tier inputs may be used to improve Google's products. Do not submit private
company code or credentials. The private server cache holds request results for up
to seven days (pruned on the next reservation); saved learning history stays in
your normal account progress. No request bodies, provider keys or raw provider
errors are logged by the handler.

Optional reference fetching selects one matching URL from a fixed official-docs
list (MDN, React, PostgreSQL or Python). It has time and size limits, disallows
redirects and never follows a user/model-provided URL. Retrieved links and dates
appear with the AI response. This is limited reference retrieval, not a web-wide
crawler. A source link is not a guarantee that every AI statement is correct.

Quota, network, validation or setup errors leave the built-in lesson available.
Use Retry explicitly after addressing an error. No need to re-enter your answer.
The automatic local shelf stops creating packs at 100; it does not delete old
answers or lessons to make room. Existing lessons remain available for revision.

## Local development of the Edge Function

Place secrets only in ignored `supabase/functions/.env`, then use
`supabase functions serve auto-coach --env-file supabase/functions/.env --no-verify-jwt`.
Local Supabase needs the same migration. The Next.js dev server alone does not run
Edge Functions. When using the hosted Supabase connection, the app calls the
hosted Edge Function even from localhost.

## References

- Secrets: https://supabase.com/docs/guides/functions/secrets
- Gemini keys: https://ai.google.dev/gemini-api/docs/api-key
- Pricing and data-use terms: https://ai.google.dev/gemini-api/docs/pricing

The source code and setup guide do not establish that your hosted function or
migration has been deployed. Confirm the first signed-in request after deployment.

## Topic conversations

Open a saved Auto coach lesson and use **Talk about this topic** to ask questions or submit follow-up answers. Each message and reply is saved with that lesson in your account. The server receives the original topic and up to three recent exchanges, bounded to 2,000 characters; older messages remain readable in the UI. Use Retry for failed messages or Copy conversation to export. Conversations allow up to 40 messages per lesson and share the existing daily Gemini limits. Replies do not mark course work complete.
