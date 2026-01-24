#!/usr/bin/env python3
"""
SQLModel Generator

This script generates SQLModel models based on specifications, following best practices
for field definitions, relationships, validation, and security patterns.
"""

import os
import sys
from pathlib import Path
import argparse
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid


def create_sqlmodel_file(
    base_dir: str,
    model_name: str,
    fields: List[Dict[str, Any]],
    relationships: Optional[List[Dict[str, Any]]] = None,
    table: bool = True
) -> str:
    """Create a SQLModel file with the specified model."""

    base_path = Path(base_dir)
    models_dir = base_path / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    # Generate imports
    imports = [
        "from sqlmodel import SQLModel, Field, Relationship",
        "from typing import Optional, List",
        "from datetime import datetime",
        "import uuid"
    ]

    # Add additional imports based on field types
    for field in fields:
        field_type = field.get('type', 'str')
        if field_type.lower() in ['email', 'emailstr']:
            imports.append("from pydantic import EmailStr")
        elif field_type.lower() in ['url', 'httpurl']:
            imports.append("from pydantic import HttpUrl")
        elif field_type.lower() == 'decimal':
            imports.append("from decimal import Decimal")

    # Add validation imports if needed
    has_validators = any(field.get('validator') for field in fields)
    if has_validators:
        imports.append("from pydantic import field_validator")

    # Generate model content
    model_content = []
    model_content.extend(imports)
    model_content.append("")  # Empty line after imports

    # Define the model class
    model_content.append(f"class {model_name}(SQLModel, table={'True' if table else 'False'}):")
    model_content.append(f'    """{model_name} model with specified fields."""')

    # Add ID field if table=True
    if table:
        model_content.append(f"    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)")

    # Add field definitions
    for field in fields:
        field_name = field['name']
        field_type = field.get('type', 'str')
        field_required = field.get('required', False)
        field_unique = field.get('unique', False)
        field_index = field.get('index', False)
        field_default = field.get('default', None)
        field_validator = field.get('validator', None)
        field_max_length = field.get('max_length', None)
        field_min_value = field.get('min_value', None)
        field_max_value = field.get('max_value', None)

        # Determine field type
        if field_type.lower() in ['email', 'emailstr']:
            actual_type = 'EmailStr'
        elif field_type.lower() in ['url', 'httpurl']:
            actual_type = 'HttpUrl'
        elif field_type.lower() == 'decimal':
            actual_type = 'Decimal'
        else:
            actual_type = field_type

        # Build field definition
        field_def_parts = [f"{field_name}: {actual_type} = "]

        # Add constraints
        constraints = []
        sa_kwargs = []

        if field_unique:
            constraints.append("unique=True")
        if field_index:
            constraints.append("index=True")
        if not field_required:
            constraints.append("default=None")
        elif field_default is not None:
            constraints.append(f"default={repr(field_default)}")

        if field_max_length:
            sa_kwargs.append(f'"max_length": {field_max_length}')
        if field_unique or field_required:
            sa_kwargs.append(f'"nullable": {not field_required}')

        if sa_kwargs:
            constraints.append(f"sa_column_kwargs={{{', '.join(sa_kwargs)}}}")

        if not constraints:
            field_def_parts.append("Field()")
        else:
            field_def_parts.append(f"Field({', '.join(constraints)})")

        model_content.append(f"    {''.join(field_def_parts)}")

    # Add timestamp fields if table=True
    if table:
        model_content.append("")
        model_content.append("    # Timestamps")
        model_content.append("    created_at: datetime = Field(default_factory=datetime.utcnow)")
        model_content.append("    updated_at: datetime = Field(default_factory=datetime.utcnow)")

    # Add validator methods if any field has validators
    if has_validators:
        model_content.append("")
        for field in fields:
            field_name = field['name']
            field_validator = field.get('validator')
            if field_validator:
                model_content.append(f"    @field_validator('{field_name}')")
                model_content.append("    @classmethod")
                model_content.append(f"    def validate_{field_name}(cls, v):")
                model_content.append(f"        # Add validation logic for {field_name}")
                model_content.append("        return v")

    # Write the model file
    model_file = models_dir / f"{model_name.lower()}.py"
    with open(model_file, 'w') as f:
        f.write('\n'.join(model_content))

    return f"Model {model_name} created in {model_file}"


def create_api_models(base_dir: str, model_name: str) -> str:
    """Create API-specific models for the given model."""

    base_path = Path(base_dir)
    models_dir = base_path / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    api_models_content = [
        "from pydantic import BaseModel",
        "from typing import Optional",
        "from datetime import datetime",
        "import uuid",
        "",
        "# API Models for",
        f"# {model_name}",
        "",
        "# Create model",
        f"class {model_name}Create(BaseModel):",
        f'    """Model for creating {model_name} instances."""',
    ]

    # Add basic fields for create model (excluding ID and timestamps)
    api_models_content.append(f"    # Add required fields for creation")

    api_models_content.extend([
        "",
        "# Update model",
        f"class {model_name}Update(BaseModel):",
        f'    """Model for updating {model_name} instances."""',
        f"    # Add optional fields for updates",
        "",
        "# Response model",
        f"class {model_name}Response(BaseModel):",
        f'    """Model for {model_name} API responses."""',
        f"    id: uuid.UUID",
        f"    # Add other fields that should be in responses",
        f"    created_at: datetime",
        f"    updated_at: datetime"
    ])

    # Write the API models file
    api_models_file = models_dir / f"{model_name.lower()}_api.py"
    with open(api_models_file, 'w') as f:
        f.write('\n'.join(api_models_content))

    return f"API models for {model_name} created in {api_models_file}"


def create_example_model(base_dir: str) -> str:
    """Create an example user model to demonstrate best practices."""

    example_content = '''from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
import uuid
import re

class User(SQLModel, table=True):
    """User model with comprehensive field validation and security."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, index=True, sa_column_kwargs={"nullable": False})
    full_name: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user")

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters')
        return v.title() if v else v

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v.lower()


class Task(SQLModel, table=True):
    """Task model with foreign key relationship."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False, "max_length": 200})
    description: Optional[str] = Field(default=None)
    status: str = Field(default="pending", sa_column_kwargs={"nullable": False})
    priority: str = Field(default="medium", sa_column_kwargs={"nullable": False})

    # Foreign key relationship
    user_id: uuid.UUID = Field(foreign_key="user.id", sa_column_kwargs={"nullable": False})

    # Relationship back-reference
    user: User = Relationship(back_populates="tasks")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
'''

    base_path = Path(base_dir)
    models_dir = base_path / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    example_file = models_dir / "example.py"
    with open(example_file, 'w') as f:
        f.write(example_content)

    return f"Example model created in {example_file}"


def create_model_with_relationships(
    base_dir: str,
    model_name: str,
    fields: List[Dict[str, Any]],
    relationships: List[Dict[str, Any]]
) -> str:
    """Create a model with relationships."""

    base_path = Path(base_dir)
    models_dir = base_path / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    # Generate imports
    imports = [
        "from sqlmodel import SQLModel, Field, Relationship",
        "from typing import Optional, List",
        "from datetime import datetime",
        "import uuid"
    ]

    # Add validation imports if needed
    has_validators = any(field.get('validator') for field in fields)
    if has_validators:
        imports.append("from pydantic import field_validator")

    # Generate model content
    model_content = []
    model_content.extend(imports)
    model_content.append("")  # Empty line after imports

    # Define the model class
    model_content.append(f"class {model_name}(SQLModel, table=True):")
    model_content.append(f'    """{model_name} model with relationships."""')

    # Add ID field
    model_content.append(f"    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)")

    # Add field definitions
    for field in fields:
        field_name = field['name']
        field_type = field.get('type', 'str')
        field_required = field.get('required', False)
        field_unique = field.get('unique', False)
        field_index = field.get('index', False)
        field_default = field.get('default', None)
        field_validator = field.get('validator', None)
        field_max_length = field.get('max_length', None)

        # Determine field type
        if field_type.lower() in ['email', 'emailstr']:
            actual_type = 'EmailStr'
        elif field_type.lower() in ['url', 'httpurl']:
            actual_type = 'HttpUrl'
        elif field_type.lower() == 'decimal':
            actual_type = 'Decimal'
        else:
            actual_type = field_type

        # Build field definition
        field_def_parts = [f"{field_name}: {actual_type} = "]

        # Add constraints
        constraints = []
        sa_kwargs = []

        if field_unique:
            constraints.append("unique=True")
        if field_index:
            constraints.append("index=True")
        if not field_required:
            constraints.append("default=None")
        elif field_default is not None:
            constraints.append(f"default={repr(field_default)}")

        if field_max_length:
            sa_kwargs.append(f'"max_length": {field_max_length}')
        if field_unique or field_required:
            sa_kwargs.append(f'"nullable": {not field_required}')

        if sa_kwargs:
            constraints.append(f"sa_column_kwargs={{{', '.join(sa_kwargs)}}}")

        if not constraints:
            field_def_parts.append("Field()")
        else:
            field_def_parts.append(f"Field({', '.join(constraints)})")

        model_content.append(f"    {''.join(field_def_parts)}")

    # Add relationships
    if relationships:
        model_content.append("")
        model_content.append("    # Relationships")
        for rel in relationships:
            rel_type = rel['type']
            rel_target = rel['target']
            rel_property = rel['property']

            if rel_type.lower() == 'foreignkey':
                # Add foreign key field
                fk_field = f"    {rel_property}_id: uuid.UUID = Field(foreign_key=\"{rel_target.lower()}.id\""
                if not rel.get('required', True):
                    fk_field += ", sa_column_kwargs={\"nullable\": True}"
                else:
                    fk_field += ", sa_column_kwargs={\"nullable\": False}"
                fk_field += ")"
                model_content.append(fk_field)
            elif rel_type.lower() == 'one-to-many':
                # Add relationship field
                model_content.append(f"    {rel_property}: List[\"{rel_target}\"] = Relationship(back_populates=\"{model_name.lower()}\")")

    # Add timestamp fields
    model_content.append("")
    model_content.append("    # Timestamps")
    model_content.append("    created_at: datetime = Field(default_factory=datetime.utcnow)")
    model_content.append("    updated_at: datetime = Field(default_factory=datetime.utcnow)")

    # Write the model file
    model_file = models_dir / f"{model_name.lower()}.py"
    with open(model_file, 'w') as f:
        f.write('\n'.join(model_content))

    return f"Model {model_name} with relationships created in {model_file}"


def create_requirements_file(base_dir: str) -> str:
    """Create requirements.txt with SQLModel dependencies."""

    requirements_content = '''sqlmodel==0.0.14
pydantic==2.5.0
pydantic[email]>=2.5.0
sqlalchemy>=2.0.0
asyncpg>=0.29.0  # For PostgreSQL async driver
psycopg2-binary>=2.9.0  # For PostgreSQL sync driver
cryptography>=41.0.0  # For encryption features
bleach>=6.0.0  # For HTML sanitization
passlib[bcrypt]>=1.7.0  # For password hashing
python-jose[cryptography]>=3.3.0  # For JWT handling
httpx>=0.25.0  # For HTTP testing
pytest>=7.4.0  # For testing
pytest-asyncio>=0.21.0  # For async testing
coverage>=7.3.0  # For test coverage
'''

    requirements_file = Path(base_dir) / "requirements.txt"
    with open(requirements_file, 'w') as f:
        f.write(requirements_content)

    return f"Requirements file created in {requirements_file}"


def create_readme(base_dir: str, project_name: str) -> str:
    """Create README.md with SQLModel information."""

    readme_content = f'''# {project_name} - SQLModel Project

This project uses SQLModel for database modeling, combining SQLAlchemy and Pydantic features.

## Models Structure

The models are organized in the `models/` directory:

```
models/
├── __init__.py
├── user.py           # User model with authentication fields
├── task.py           # Task model with relationships
├── example.py        # Example model with best practices
└── user_api.py       # API-specific user models
```

## SQLModel Features Used

- **Dual Nature**: Models serve as both SQLAlchemy ORM models and Pydantic validation schemas
- **Type Safety**: Full type hints support
- **Validation**: Pydantic validators for field validation
- **Relationships**: SQLAlchemy-like relationship definitions
- **Automatic Schema Generation**: From model definitions
- **Async Support**: Compatible with async/await patterns

## Best Practices Implemented

- UUID primary keys for security
- Proper field constraints and validation
- Relationship definitions with back-populates
- Timestamp management
- API model separation (Create, Update, Response models)
- Security-conscious field exposure

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up your database connection in your application configuration

3. Import and use models:
   ```python
   from models.user import User
   from models.task import Task
   ```

## Model Generation

Use the provided generator script to create new models:
```bash
python scripts/generate_model.py --name Post --fields "title:str:required" "content:str" "author_id:uuid:required"
```

## Security Considerations

- Never expose sensitive fields like password hashes in API responses
- Use proper validation for all user inputs
- Implement role-based field access where appropriate
- Use UUIDs for primary keys to prevent enumeration attacks
'''

    readme_file = Path(base_dir) / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)

    return f"README created in {readme_file}"


def main():
    parser = argparse.ArgumentParser(description='Generate SQLModel models and structure')
    parser.add_argument('--project-name', required=True, help='Name of the project')
    parser.add_argument('--output-dir', default='.', help='Output directory (default: current directory)')
    parser.add_argument('--create-model', help='Create a new model with specified fields (format: name:type:flags)')
    parser.add_argument('--add-field', action='append', help='Add field to model (format: name:type:required)')
    parser.add_argument('--with-relationships', help='Add relationships to the model')

    args = parser.parse_args()

    # Create basic project structure
    base_path = Path(args.output_dir) / args.project_name
    base_path.mkdir(parents=True, exist_ok=True)

    print(f"Creating SQLModel project structure in {base_path}/")

    # Create __init__.py in models directory
    models_init = base_path / "models" / "__init__.py"
    models_init.parent.mkdir(parents=True, exist_ok=True)
    models_init.touch(exist_ok=True)

    # Create example model
    print(create_example_model(str(base_path)))

    # Create requirements file
    print(create_requirements_file(str(base_path)))

    # Create README
    print(create_readme(str(base_path), args.project_name))

    # Create the specified model if provided
    if args.create_model:
        # Parse field definitions from command line
        fields = []
        if args.add_field:
            for field_def in args.add_field:
                parts = field_def.split(':')
                if len(parts) >= 2:
                    field_info = {
                        'name': parts[0],
                        'type': parts[1],
                        'required': 'required' in parts[2:] if len(parts) > 2 else False
                    }
                    if 'unique' in parts[2:]:
                        field_info['unique'] = True
                    if 'index' in parts[2:]:
                        field_info['index'] = True
                    fields.append(field_info)

        # Create the model
        result = create_sqlmodel_file(
            str(base_path),
            args.create_model,
            fields
        )
        print(result)

        # Create corresponding API models
        api_result = create_api_models(str(base_path), args.create_model)
        print(api_result)

    print(f"\\nSQLModel project {args.project_name} has been generated successfully!")
    print(f"Directory: {base_path}")
    print("\\nNext steps:")
    print(f"  cd {base_path}")
    print("  pip install -r requirements.txt")
    print("  # Start implementing your application logic")


if __name__ == "__main__":
    main()