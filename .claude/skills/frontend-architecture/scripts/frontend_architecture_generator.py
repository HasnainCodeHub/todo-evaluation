#!/usr/bin/env python3
"""
Frontend Architecture Generator

This script generates a complete frontend architecture based on best practices,
including directory structure, component organization, and API integration patterns.
"""

import os
import sys
from pathlib import Path
import argparse
import json
from typing import Dict, Any, List


def create_directory_structure(base_dir: str, structure_type: str = "feature-based") -> str:
    """Create the frontend directory structure."""

    base_path = Path(base_dir)
    base_path.mkdir(parents=True, exist_ok=True)

    if structure_type == "feature-based":
        # Feature-based structure
        dirs = [
            base_path / "components" / "ui",  # Reusable UI components
            base_path / "components" / "features",  # Feature-specific components
            base_path / "hooks",  # Custom hooks
            base_path / "lib" / "api",  # API clients and services
            base_path / "lib" / "utils",  # Utility functions
            base_path / "types",  # TypeScript definitions
            base_path / "styles",  # Global styles
            base_path / "contexts",  # React context providers
            base_path / "store",  # State management (if using Redux/Zustand)
        ]
    else:  # component-based structure
        dirs = [
            base_path / "atoms",  # Basic components
            base_path / "molecules",  # Combined components
            base_path / "organisms",  # Complex components
            base_path / "templates",  # Layout components
            base_path / "pages",  # Page components
            base_path / "hooks",
            base_path / "lib" / "api",
            base_path / "lib" / "utils",
            base_path / "types",
            base_path / "styles",
        ]

    # Create all directories
    for directory in dirs:
        directory.mkdir(parents=True, exist_ok=True)

    return f"Directory structure created in {base_dir}/"


def create_component_template(component_name: str, directory: str = "./components/ui") -> str:
    """Create a basic component template."""

    component_dir = Path(directory) / component_name
    component_dir.mkdir(parents=True, exist_ok=True)

    # Create component file
    component_content = f'''import React from 'react';
import type {{ FC }} from 'react';

interface {component_name}Props {{
  /** Component description */
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}}

export const {component_name}: FC<{component_name}Props> = ({{
  children,
  className = '',
  ...props
}}) => {{
  return (
    <div className={`relative ${{}className}}` {{...props}}>
      {{children}}
    </div>
  );
}};

export default {component_name};
'''

    with open(component_dir / f"{component_name}.tsx", 'w') as f:
        f.write(component_content)

    # Create test file
    test_content = f'''import {{ render, screen }} from '@testing-library/react';
import {component_name} from './{component_name}';

describe('{component_name}', () => {{
  it('renders children correctly', () => {{
    const testText = 'Test content';
    render(<{component_name}>{{testText}}</{component_name}>);
    expect(screen.getByText(testText)).toBeInTheDocument();
  }});

  it('applies custom className', () => {{
    const customClass = 'custom-class';
    render(<{component_name} className="{{customClass}}" />);
    expect(screen.getByRole('generic')).toHaveClass(customClass);
  }});
}});
'''

    with open(component_dir / f"{component_name}.test.tsx", 'w') as f:
        f.write(test_content)

    # Create story file
    story_content = f'''import type {{ Meta, StoryObj }} from '@storybook/react';
import {{ {component_name} }} from './{component_name}';

const meta: Meta<typeof {component_name}> = {{
  title: 'Components/{component_name}',
  component: {component_name},
  tags: ['autodocs'],
  argTypes: {{
    children: {{ control: {{ type: 'text' }} }},
    className: {{ control: {{ type: 'text' }} }},
  }},
}};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {{
  args: {{
    children: '{component_name} content',
  }},
}};
'''

    with open(component_dir / f"{component_name}.stories.tsx", 'w') as f:
        f.write(story_content)

    # Create types file
    types_content = f'''/** {component_name} component types */

export interface {component_name}Props {{
  /** Component description */
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}}

export interface {component_name}StyleProps {{
  /** Style variations */
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}}
'''

    with open(component_dir / "types.ts", 'w') as f:
        f.write(types_content)

    return f"Component {component_name} created with template files"


def create_api_service(service_name: str, directory: str = "./lib/api") -> str:
    """Create a basic API service template."""

    api_dir = Path(directory)
    api_dir.mkdir(parents=True, exist_ok=True)

    # Create service file
    service_content = f'''import axios, {{ AxiosInstance, AxiosResponse }} from 'axios';

// Create base API client
const createApiClient = (): AxiosInstance => {{
  const client = axios.create({{
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
    timeout: 10000,
    headers: {{
      'Content-Type': 'application/json',
    }},
  }});

  // Add request interceptor for auth
  client.interceptors.request.use(
    (config) => {{
      const token = localStorage.getItem('authToken');
      if (token) {{
        config.headers.Authorization = `Bearer ${{token}}`;
      }}
      return config;
    }},
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {{
      if (error.response?.status === 401) {{
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }}
      return Promise.reject(error);
    }}
  );

  return client;
}};

const apiClient = createApiClient();

// Define types
export interface {service_name.capitalize()} {{
  id: string;
  // Add other fields as needed
}}

export interface {service_name.capitalize()}Response {{
  data: {service_name.capitalize()}[];
  pagination?: {{
    page: number;
    limit: number;
    total: number;
  }};
}}

// Service functions
export const {service_name}Service = {{
  getAll: async (params?: {{ page?: number; limit?: number }}): Promise<AxiosResponse<{service_name.capitalize()}Response>> => {{
    return await apiClient.get('/{service_name}', {{ params }});
  }},

  getById: async (id: string): Promise<AxiosResponse<{service_name.capitalize()}>> => {{
    return await apiClient.get(`/{service_name}/${{id}}`);
  }},

  create: async (data: Partial<{service_name.capitalize()}>): Promise<AxiosResponse<{service_name.capitalize()}>> => {{
    return await apiClient.post(`/{service_name}`, data);
  }},

  update: async (id: string, data: Partial<{service_name.capitalize()}>): Promise<AxiosResponse<{service_name.capitalize()}>> => {{
    return await apiClient.put(`/{service_name}/${{id}}`, data);
  }},

  delete: async (id: string): Promise<AxiosResponse<void>> => {{
    return await apiClient.delete(`/{service_name}/${{id}}`);
  }},
}};

export default {service_name}Service;
'''

    service_file = api_dir / f"{service_name}Service.ts"
    with open(service_file, 'w') as f:
        f.write(service_content)

    return f"API service {service_name} created"


def create_hook_template(hook_name: str, directory: str = "./hooks") -> str:
    """Create a custom hook template."""

    hooks_dir = Path(directory)
    hooks_dir.mkdir(parents=True, exist_ok=True)

    # Create hook file
    hook_content = f'''import {{ useState, useEffect, useCallback }} from 'react';

interface {hook_name[4:].capitalize()}State {{
  // Define state interface
  data: any[] | null;
  loading: boolean;
  error: string | null;
}}

const use{hook_name[4:].capitalize()} = (initialParams?: any) => {{
  const [state, setState] = useState<{hook_name[4:].capitalize()}State>({{
    data: null,
    loading: false,
    error: null,
  }});

  const fetchData = useCallback(async (params = initialParams) => {{
    setState(prev => ({{ ...prev, loading: true, error: null }}));

    try {{
      // Replace with actual API call
      // const response = await apiService.getData(params);
      // setState(prev => ({{ ...prev, data: response.data, loading: false }}));

      // Placeholder implementation
      setState(prev => ({{ ...prev, data: [], loading: false }}));
    }} catch (error) {{
      setState(prev => ({{ ...prev, error: error instanceof Error ? error.message : 'Unknown error', loading: false }}));
    }}
  }}, [initialParams]);

  useEffect(() => {{
    if (initialParams) {{
      fetchData();
    }}
  }}, []);

  return {{ ...state, refetch: fetchData }};
}};

export default use{hook_name[4:].capitalize()};
'''

    hook_file = hooks_dir / f"{hook_name}.ts"
    with open(hook_file, 'w') as f:
        f.write(hook_content)

    return f"Hook {hook_name} created"


def create_package_json(directory: str = ".") -> str:
    """Create a package.json with recommended frontend dependencies."""

    package_json = {
        "name": "frontend-architecture",
        "version": "1.0.0",
        "description": "Frontend architecture with best practices",
        "main": "index.js",
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint",
            "test": "jest",
            "test:watch": "jest --watch",
            "storybook": "storybook dev -p 6006",
            "build-storybook": "storybook build"
        },
        "dependencies": {
            "next": "^14.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "axios": "^1.6.0",
            "zustand": "^4.4.0",
            "@tanstack/react-query": "^5.0.0"
        },
        "devDependencies": {
            "@types/react": "^18.2.0",
            "@types/node": "^20.0.0",
            "@types/react-dom": "^18.2.0",
            "typescript": "^5.0.0",
            "jest": "^29.0.0",
            "@testing-library/react": "^14.0.0",
            "@storybook/react": "^7.0.0",
            "@storybook/addon-essentials": "^7.0.0",
            "eslint": "^8.0.0",
            "eslint-config-next": "^14.0.0"
        }
    }

    package_file = Path(directory) / "package.json"
    with open(package_file, 'w') as f:
        json.dump(package_json, f, indent=2)

    return "package.json created with recommended dependencies"


def create_tsconfig(directory: str = ".") -> str:
    """Create a tsconfig.json with recommended settings."""

    tsconfig = {
        "compilerOptions": {
            "target": "es5",
            "lib": ["dom", "dom.iterable", "es6"],
            "allowJs": True,
            "skipLibCheck": True,
            "strict": True,
            "noEmit": True,
            "esModuleInterop": True,
            "module": "esnext",
            "moduleResolution": "bundler",
            "resolveJsonModule": True,
            "isolatedModules": True,
            "jsx": "preserve",
            "incremental": True,
            "plugins": [
                {
                    "name": "next"
                }
            ],
            "baseUrl": ".",
            "paths": {
                "@/*": ["./*"],
                "@/components/*": ["components/*"],
                "@/lib/*": ["lib/*"],
                "@/hooks/*": ["hooks/*"],
                "@/types/*": ["types/*"]
            }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
    }

    tsconfig_file = Path(directory) / "tsconfig.json"
    with open(tsconfig_file, 'w') as f:
        json.dump(tsconfig, f, indent=2)

    return "tsconfig.json created with recommended settings"


def create_readme(project_name: str, directory: str = ".") -> str:
    """Create a README.md with project information."""

    readme_content = f"""# {project_name}

This project follows modern frontend architecture best practices with organized components, proper state management, and API integration patterns.

## Architecture Overview

### Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base components (Button, Input, etc.)
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API clients
│   ├── api/            # API service files
│   └── utils/          # Helper functions
├── types/               # TypeScript definitions
├── styles/              # Global styles
├── contexts/            # React context providers
└── store/               # State management (if applicable)
```

### Component Organization
Components are organized using a feature-based approach where related functionality is grouped together.

### API Integration
API calls are centralized in the `lib/api` directory with proper error handling and type safety.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm run test
   ```

4. Start Storybook for component development:
   ```bash
   npm run storybook
   ```

## Best Practices

- **Type Safety**: Full TypeScript coverage
- **Component Design**: Single responsibility principle
- **State Management**: Appropriate tools for the job
- **API Integration**: Centralized, typed service layer
- **Testing**: Unit and integration tests for all components
- **Accessibility**: Proper ARIA attributes and semantic HTML
"""

    readme_file = Path(directory) / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)

    return "README.md created with project information"


def main():
    parser = argparse.ArgumentParser(description='Generate frontend architecture')
    parser.add_argument('--project-name', required=True, help='Name of the project')
    parser.add_argument('--output-dir', default='.', help='Output directory (default: current directory)')
    parser.add_argument('--structure-type', choices=['feature-based', 'component-based'],
                       default='feature-based', help='Type of directory structure to create')
    parser.add_argument('--create-component', help='Create a new component with template')
    parser.add_argument('--create-service', help='Create a new API service with template')
    parser.add_argument('--create-hook', help='Create a new custom hook with template')

    args = parser.parse_args()

    # Create base directory structure
    print(create_directory_structure(args.output_dir, args.structure_type))

    # Create additional files
    print(create_package_json(args.output_dir))
    print(create_tsconfig(args.output_dir))
    print(create_readme(args.project_name, args.output_dir))

    # Create optional templates
    if args.create_component:
        print(create_component_template(args.create_component))

    if args.create_service:
        print(create_api_service(args.create_service))

    if args.create_hook:
        print(create_hook_template(args.create_hook))

    print(f"\\nFrontend architecture for {args.project_name} has been generated successfully!")
    print(f"Directory: {args.output_dir}")


if __name__ == "__main__":
    main()