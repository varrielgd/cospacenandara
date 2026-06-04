# AI Provider Fallback Logic

## Overview
The system implements automatic fallback between **Groq** and **Gemini** AI providers. If one provider hits a rate limit or fails, the system automatically switches to the other provider.

## Configuration

### Required Environment Variables
```env
# Primary provider - Groq (free tier, high rate limits)
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama3-70b-8192"  # or mixtral-8x7b-32768

# Secondary provider - Gemini (free tier)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"  # or gemini-pro
```

## How It Works

### Email Generation with Fallback
Location: `backend/src/services/ai.service.ts`

1. **Primary Provider**: Starts with Groq (more generous free tier)
   ```
   generateEmailDraft() → tryGroq()
   ```

2. **Rate Limit Detected**: If Groq returns 429 or "rate limit" error
   ```
   ✗ Groq fails → Switch to Gemini
   generateEmailDraft() → tryGemini()
   ```

3. **Secondary Provider**: Tries Gemini
   ```
   ✓ Gemini succeeds → Return result
   ```

4. **Both Fail**: Returns fallback template
   ```
   ✗ Both fail → Return hardcoded professional email template
   ```

### Provider Switching Logic
```typescript
// primaryProvider starts as 'groq'
private static primaryProvider: 'groq' | 'gemini' = 'groq';

// When one fails:
if (groqFails) {
  this.primaryProvider = 'gemini';  // Switch primary
  tryGemini();
}

// Next call will try Gemini first, then fall back to Groq
```

## Error Detection

### Rate Limit Detection
- **Groq**: `error.status === 429` or `error.message.includes('rate limit')`
- **Gemini**: `error.message.includes('429')` or `error.message.includes('rate limit')`

### Logging
All provider switches are logged to console and file:
```
[WARN] Switching primary AI provider to Gemini due to Groq failure
[WARN] Groq rate limited: Rate limit exceeded...
[INFO] Attempting AI generation with Gemini...
```

## Usage in Application

### Email Generation
```typescript
// Called by: POST /api/emails/generate
const { subject, body } = await AiService.generateEmailDraft(
  importerName,
  context,
  'professional'
);
```

### Automatic Fallback
No additional configuration needed. The system automatically:
1. Tries primary provider
2. Detects rate limits
3. Switches provider
4. Retries with secondary provider
5. Returns fallback if both fail

## Testing Fallback

### To Test Groq → Gemini Fallback
1. Use incorrect/empty GROQ_API_KEY
2. Make email generation request
3. System will fail on Groq and switch to Gemini
4. Check logs for: "Switching primary AI provider to Gemini"

### To Test Gemini → Groq Fallback
1. Use incorrect GEMINI_API_KEY
2. Make email generation request
3. System will fail on Gemini and switch to Groq
4. Check logs for: "Switching primary AI provider to Groq"

### To Test Fallback Template
1. Leave both API keys empty
2. Make email generation request
3. System returns professional template without calling any API

## Model Selection Guide

### Groq Models (Free Tier)
- `llama3-70b-8192` ⭐ Recommended - Best quality, 8K context
- `mixtral-8x7b-32768` - Faster but slightly lower quality
- `llama2-70b-4096` - Older model

### Gemini Models (Free Tier)
- `gemini-1.5-flash` ⭐ Recommended - Fast and cheap
- `gemini-pro` - Older model
- `gemini-pro-vision` - With vision capabilities (not used for email)

## Cost Analysis (as of 2025)
- **Groq**: Free tier ✓ (unlimited for development)
- **Gemini**: Free tier ✓ (limited quota per month)
- **Fallback**: No API calls needed ✓

## Deprecated Providers (No Longer Used)
- ~~SerpAPI~~ → Replaced with AI-powered discovery
- ~~ScraperAPI~~ → Replaced with AI-powered discovery

SerpAPI and ScraperAPI were generating realistic importer data, but caused rate limiting issues. Now using direct AI generation for more reliable results.

## Migration from Old System

### Before (Problematic)
```env
SERPAPI_API_KEY=xxx
SCRAPERAPI_API_KEY=xxx
VITE_API_SOURCE=serp  # Could be serp, scraper, or ai
```

### Now (Simplified)
```env
GROQ_API_KEY=xxx
GEMINI_API_KEY=xxx
# System automatically chooses best provider
```

No code changes needed - the switch is transparent to the application.
