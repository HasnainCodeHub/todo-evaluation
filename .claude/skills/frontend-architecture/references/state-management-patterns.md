# State Management Patterns

## Choosing the Right State Management Solution

### When to Use Different Approaches

#### useState (Local Component State)
- Individual component state
- Simple toggle states
- Form inputs
- Component-specific data

```typescript
const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
```

#### useContext (Cross-Component State)
- Theme settings
- User authentication
- Language preferences
- Global configuration

```typescript
// ThemeContext.ts
const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Usage
const Component = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  );
};
```

#### Custom Hooks (Reusable State Logic)
- Complex state logic that's reused across components
- Stateful business logic
- Data fetching patterns

```typescript
// hooks/useLocalStorage.ts
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};
```

## Centralized State Management

### Zustand (Lightweight Global State)
Best for medium-sized applications with moderate complexity.

```typescript
// stores/userStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  fetchUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, error: null }),
  clearUser: () => set({ user: null }),
  fetchUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false });
    }
  },
}));

// Usage
const UserProfile = () => {
  const { user, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser('123');
  }, []);

  if (!user) return <div>Loading...</div>;

  return <div>{user.name}</div>;
};
```

### Redux Toolkit (Complex Applications)
Best for large applications with complex state interactions.

```typescript
// stores/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
};

// Async thunk for fetching user
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

// Usage in component
import { useSelector, useDispatch } from 'react-redux';
import { fetchUser } from './stores/userSlice';

const UserProfile = () => {
  const { user, isLoading, error } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUser('123'));
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{user?.name}</div>;
};
```

## Data Fetching Patterns

### SWR (Stale-While-Revalidate)
Excellent for server data that needs to be kept fresh.

```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const Profile = () => {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}!</div>;
};

// With mutation for updates
const UpdateButton = () => {
  const { mutate } = useSWR('/api/user', fetcher);

  const updateUser = async () => {
    const updatedUser = await fetch('/api/user', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' })
    }).then(r => r.json());

    // Update the cache
    mutate(updatedUser, false);
  };

  return <button onClick={updateUser}>Update Name</button>;
};
```

### React Query (TanStack Query)
Powerful for complex server state management.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Profile = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
  });

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}!</div>;
};

// Mutation with cache invalidation
const UpdateButton = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userData: any) =>
      fetch('/api/user', {
        method: 'PUT',
        body: JSON.stringify(userData)
      }).then(res => res.json()),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return (
    <button
      onClick={() => mutation.mutate({ name: 'New Name' })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Updating...' : 'Update Name'}
    </button>
  );
};
```

## State Best Practices

### Avoid Prop Drilling
Instead of passing props deeply, lift state up or use context:

```typescript
// Avoid: Prop drilling
const App = () => {
  const [user, setUser] = useState(null);
  return <Layout user={user}><Main user={user} /></Layout>;
};

const Layout = ({ user }) => <div><Header user={user} /><Main user={user} /></div>;

// Better: Context
const App = () => {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout><Main /></Layout>
    </UserContext.Provider>
  );
};
```

### Normalize Complex State
For complex nested data, consider normalization:

```typescript
// Instead of nested objects
const complexState = {
  users: [
    { id: 1, name: 'John', posts: [1, 2, 3] },
    { id: 2, name: 'Jane', posts: [4, 5] }
  ],
  posts: [
    { id: 1, title: 'Post 1', author: 1 },
    { id: 2, title: 'Post 2', author: 1 },
    { id: 3, title: 'Post 3', author: 1 },
    { id: 4, title: 'Post 4', author: 2 },
    { id: 5, title: 'Post 5', author: 2 }
  ]
};

// Use normalized structure
const normalizedState = {
  users: {
    1: { id: 1, name: 'John', postIds: [1, 2, 3] },
    2: { id: 2, name: 'Jane', postIds: [4, 5] }
  },
  posts: {
    1: { id: 1, title: 'Post 1', authorId: 1 },
    2: { id: 2, title: 'Post 2', authorId: 1 },
    // ... etc
  }
};
```

### Performance Considerations

#### Selective Re-rendering
Only subscribe to the state you need:

```typescript
// Good: Selective subscription
const userName = useSelector(state => state.user.name);
const userEmail = useSelector(state => state.user.email);

// Avoid: Object creation on every render
const userInfo = useSelector(state => ({
  name: state.user.name,
  email: state.user.email
}));
```

#### Immutable Updates
Always update state immutably:

```typescript
// Good: Immutable update
const addItem = (item) => {
  setItems(prevItems => [...prevItems, item]);
};

const updateItem = (id, updates) => {
  setItems(prevItems =>
    prevItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  );
};

// Avoid: Mutating state directly
const addItem = (item) => {
  items.push(item); // Don't do this
  setItems(items);
};
```

These patterns help create maintainable, scalable, and performant state management in your applications.