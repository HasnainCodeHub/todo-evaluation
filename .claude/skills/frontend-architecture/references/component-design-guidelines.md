# Component Design Guidelines

## Principles of Component Design

### Single Responsibility Principle
Each component should have one clear purpose and do it well. This makes components easier to test, understand, and reuse.

```typescript
// Good: Single responsibility
const UserAvatar = ({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <img
      src={user.avatar}
      alt={user.name}
      className={`rounded-full ${sizeClasses[size]}`}
    />
  )
}

// Avoid: Multiple responsibilities
const UserProfileCard = ({ user }) => {
  // Handles avatar, user info, actions, and layout
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button>Message</button>
      <button>Edit</button>
    </div>
  )
}
```

### Composition Over Inheritance
Build complex UIs by composing simpler components rather than extending them.

```typescript
// Good: Composition
const Card = ({ children, title }) => (
  <div className="card">
    {title && <h3>{title}</h3>}
    <div className="card-body">{children}</div>
  </div>
)

const UserCard = ({ user }) => (
  <Card title={user.name}>
    <UserAvatar user={user} />
    <UserInfo user={user} />
    <UserActions userId={user.id} />
  </Card>
)
```

## Component API Design

### Props Interface
Design clear, predictable props interfaces:

```typescript
// Well-defined interface
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = ''
}) => {
  // Implementation
}
```

### Default Props
Provide sensible defaults to reduce boilerplate:

```typescript
// Good defaults
const Input = ({
  type = 'text',
  variant = 'default',
  size = 'md',
  disabled = false,
  required = false,
  ...props
}: InputProps) => {
  // Implementation with sensible defaults
}
```

## Component Folder Structure

### Atomic Design Pattern
Organize components using atomic design principles:

```
components/
├── atoms/           # Basic elements (Button, Input, Text)
├── molecules/       # Combined atoms (InputWithLabel, ButtonGroup)
├── organisms/       # Complex components (LoginForm, UserCard)
├── templates/       # Layout structures (PageLayout, DashboardLayout)
└── pages/          # Page-specific components
```

### Feature-Based Organization
Alternatively, organize by feature:

```
features/
├── auth/
│   ├── components/
│   │   ├── LoginForm/
│   │   ├── SignupForm/
│   │   └── ForgotPassword/
│   ├── hooks/
│   └── types/
├── dashboard/
│   ├── components/
│   ├── hooks/
│   └── types/
└── profile/
    ├── components/
    ├── hooks/
    └── types/
```

## Component Performance

### Memoization
Use React.memo, useMemo, and useCallback appropriately:

```typescript
// Memoize expensive computations
const ExpensiveComponent = ({ data, filters }) => {
  const filteredData = useMemo(() => {
    return data.filter(item =>
      filters.includes(item.category)
    )
  }, [data, filters])

  return <DataTable data={filteredData} />
}

// Memoize callback functions
const Parent = () => {
  const [count, setCount] = useState(0)

  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  return <Child onIncrement={handleIncrement} />
}
```

### Code Splitting
Split components that aren't always needed:

```typescript
const LazyFeature = lazy(() => import('./FeatureComponent'))

const Container = () => (
  <Suspense fallback={<Loader />}>
    <LazyFeature />
  </Suspense>
)
```

## Accessibility (a11y)

### Semantic HTML
Use semantic HTML elements when possible:

```typescript
// Good: Semantic
const Navigation = () => (
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
)

// Less ideal: Non-semantic
const Navigation = () => (
  <div>
    <div>
      <div><div>Home</div></div>
      <div><div>About</div></div>
    </div>
  </div>
)
```

### ARIA Attributes
Use ARIA attributes when semantic HTML isn't sufficient:

```typescript
const Modal = ({ isOpen, onClose, title }) => {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">{title}</h2>
      {/* Modal content */}
      <button
        aria-label="Close modal"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}
```

## Testing Components

### Component Testing Structure
```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx
│   └── types.ts
```

### Testing Guidelines
- Test component behavior, not implementation
- Test user interactions
- Test accessibility attributes
- Test edge cases and error states

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'

test('calls onClick when clicked', () => {
  const mockOnClick = jest.fn()
  render(<Button onClick={mockOnClick}>Click me</Button>)

  fireEvent.click(screen.getByText('Click me'))
  expect(mockOnClick).toHaveBeenCalledTimes(1)
})

test('is accessible via keyboard', () => {
  const mockOnClick = jest.fn()
  render(<Button onClick={mockOnClick}>Submit</Button>)

  const button = screen.getByRole('button')
  fireEvent.keyDown(button, { key: 'Enter' })
  expect(mockOnClick).toHaveBeenCalledTimes(1)
})
```

## Component Documentation

### JSDoc Comments
Document component props and usage:

```typescript
/**
 * A customizable button component
 *
 * @param {React.ReactNode} children - Button content
 * @param {'primary' | 'secondary'} variant - Button style variant
 * @param {boolean} disabled - Whether button is disabled
 * @param {Function} onClick - Click handler function
 *
 * @example
 * <Button variant="primary" onClick={handleSubmit}>
 *   Submit
 * </Button>
 */
const Button = ({ children, variant = 'primary', disabled, onClick }) => {
  // Implementation
}
```

### Storybook Integration
Create stories for component visualization and testing:

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: { type: 'radio', options: ['primary', 'secondary'] } },
    size: { control: { type: 'radio', options: ['sm', 'md', 'lg'] } },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
}

export const Disabled: Story = {
  args: {
    ...Primary.args,
    disabled: true,
  },
}
```

Following these guidelines ensures components are maintainable, reusable, accessible, and performant.