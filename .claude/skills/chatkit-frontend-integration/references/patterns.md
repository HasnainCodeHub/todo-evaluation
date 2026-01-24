# ChatKit Integration Patterns

## Quick Reference

### Minimal Setup (Hosted)

```tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function Chat() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', { method: 'POST' });
        return (await res.json()).client_secret;
      },
    },
  });

  return <ChatKit control={control} className="h-[600px] w-[320px]" />;
}
```

### Minimal Setup (Custom Backend)

```tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function Chat() {
  const { control } = useChatKit({
    api: {
      url: process.env.NEXT_PUBLIC_CHATKIT_URL,
      domainKey: process.env.NEXT_PUBLIC_DOMAIN_KEY,
    },
  });

  return <ChatKit control={control} className="h-[600px] w-[320px]" />;
}
```

---

## Advanced Patterns

### With Error Boundary

```tsx
// components/chat/ChatErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          <h3>Chat temporarily unavailable</h3>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
export function ChatWithErrorBoundary() {
  return (
    <ChatErrorBoundary>
      <ChatWidget />
    </ChatErrorBoundary>
  );
}
```

### With Auth Integration

```tsx
// components/chat/AuthenticatedChat.tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuth } from '@/hooks/useAuth';

export function AuthenticatedChat() {
  const { user, accessToken } = useAuth();

  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            refreshToken: existing,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create chat session');
        }

        return (await res.json()).client_secret;
      },
    },
    onError: (e) => {
      console.error('Chat error:', e.detail);
    },
  });

  if (!user) {
    return <div>Please sign in to use chat</div>;
  }

  return <ChatKit control={control} className="h-full" />;
}
```

### With Thread Persistence

```tsx
// components/chat/PersistentChat.tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useState, useEffect } from 'react';

const THREAD_STORAGE_KEY = 'chatkit_thread_id';

export function PersistentChat() {
  const [savedThreadId, setSavedThreadId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THREAD_STORAGE_KEY);
    if (stored) setSavedThreadId(stored);
  }, []);

  const { control, setThreadId } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', { method: 'POST' });
        return (await res.json()).client_secret;
      },
    },
    onThreadChange: (e) => {
      const newThreadId = e.detail?.threadId;
      if (newThreadId) {
        localStorage.setItem(THREAD_STORAGE_KEY, newThreadId);
        setSavedThreadId(newThreadId);
      }
    },
  });

  useEffect(() => {
    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
  }, [savedThreadId, setThreadId]);

  return (
    <div>
      <ChatKit control={control} className="h-[600px]" />
      {savedThreadId && (
        <button
          onClick={() => {
            localStorage.removeItem(THREAD_STORAGE_KEY);
            setSavedThreadId(null);
          }}
          className="mt-2 text-sm text-gray-500"
        >
          Start new conversation
        </button>
      )}
    </div>
  );
}
```

### With Custom Styling

```tsx
// components/chat/StyledChat.tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function StyledChat() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', { method: 'POST' });
        return (await res.json()).client_secret;
      },
    },
  });

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      <ChatKit
        control={control}
        className="h-[600px] w-[380px]"
        style={{
          '--chatkit-primary': '#6366f1',
          '--chatkit-bg': '#f8fafc',
          '--chatkit-text': '#1e293b',
        } as React.CSSProperties}
      />
    </div>
  );
}
```

---

## Backend Patterns

### FastAPI with Rate Limiting

```python
# app/api/chatkit.py
from fastapi import APIRouter, HTTPException, Depends, Request
from openai import OpenAI
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/chatkit")
client = OpenAI()

@router.post("/session")
@limiter.limit("10/minute")
async def create_session(request: Request):
    try:
        session = client.chatkit.sessions.create(
            model="gpt-4o",
        )
        return {"client_secret": session.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Next.js with User Context

```typescript
// app/api/chatkit/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const chatSession = await openai.chatkit.sessions.create({
      model: 'gpt-4o',
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      client_secret: chatSession.client_secret
    });
  } catch (error) {
    console.error('ChatKit error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

---

## Environment Configuration

### Development (.env.local)

```bash
# Backend only - never expose
OPENAI_API_KEY=sk_test_xxxxxxxxxxxxxxxx

# For custom backend integration (optional)
NEXT_PUBLIC_CHATKIT_URL=http://localhost:8000/api/chatkit
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=dk_dev_xxxxxxxx
```

### Production (.env.production)

```bash
# Backend only - never expose
OPENAI_API_KEY=sk_live_xxxxxxxxxxxxxxxx

# For custom backend integration (optional)
NEXT_PUBLIC_CHATKIT_URL=https://api.yourdomain.com/chatkit
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=dk_prod_xxxxxxxx
```

---

## Testing Patterns

### Mock useChatKit for Tests

```tsx
// __mocks__/@openai/chatkit-react.tsx
export const useChatKit = jest.fn(() => ({
  control: {},
  ref: { current: null },
  focusComposer: jest.fn(),
  setThreadId: jest.fn(),
  sendUserMessage: jest.fn(),
  setComposerValue: jest.fn(),
}));

export const ChatKit = jest.fn(({ className }) => (
  <div data-testid="chatkit-mock" className={className}>
    ChatKit Mock
  </div>
));
```

### Integration Test

```tsx
// __tests__/Chat.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Chat } from '@/components/Chat';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ client_secret: 'test_secret' }),
  })
) as jest.Mock;

describe('Chat', () => {
  it('renders ChatKit component', async () => {
    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByTestId('chatkit-mock')).toBeInTheDocument();
    });
  });

  it('requests client secret on mount', async () => {
    render(<Chat />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/chatkit/session', {
        method: 'POST',
      });
    });
  });
});
```

---

## Deployment Checklist

### Before Going Live

```markdown
## Domain Configuration
- [ ] Added production domain to OpenAI allowlist
- [ ] Waited 20-30 minutes for propagation
- [ ] Verified domain shows "Active" in settings

## Security
- [ ] API key is server-side only (no NEXT_PUBLIC_)
- [ ] Token refresh implemented
- [ ] Error handling doesn't expose sensitive info
- [ ] Rate limiting on session endpoint

## Testing
- [ ] Works on production domain
- [ ] Handles network failures gracefully
- [ ] Token refresh works before expiry
- [ ] Error boundary catches component errors

## Monitoring
- [ ] Error logging configured
- [ ] Session creation tracked
- [ ] Response times monitored
```

---

## Common Issues & Solutions

### Issue: Widget shows blank

**Solution**: Check domain allowlist, wait 20-30 min, verify exact domain match

### Issue: 401 on session creation

**Solution**: Verify API key belongs to same org as allowlist

### Issue: CORS errors

**Solution**: Configure backend CORS to allow frontend origin

### Issue: Token expires mid-conversation

**Solution**: Implement token refresh in `getClientSecret(existing)`

### Issue: Localhost development blocked

**Solution**: Use ngrok or custom backend with domain key
