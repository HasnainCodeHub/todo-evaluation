# SQLModel Relationship Patterns

## One-to-Many Relationships

### Basic One-to-Many
The most common relationship pattern where one entity has many related entities:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
import uuid

class Author(SQLModel, table=True):
    """One author can have many books."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    email: Optional[str] = Field(default=None)

    # One-to-many: Author has many Books
    books: List["Book"] = Relationship(back_populates="author")

class Book(SQLModel, table=True):
    """Many books belong to one author."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False})
    isbn: Optional[str] = Field(default=None)

    # Foreign key to Author
    author_id: uuid.UUID = Field(foreign_key="author.id", sa_column_kwargs={"nullable": False})

    # Relationship back-reference
    author: Author = Relationship(back_populates="books")
```

### Bidirectional One-to-Many with Cascade Options
More advanced one-to-many with cascade behaviors:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List
import uuid

class Category(SQLModel, table=True):
    """Category with cascade delete for products."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})

    # One-to-many with cascade delete
    products: List["Product"] = Relationship(
        back_populates="category",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",  # Delete products when category is deleted
            "lazy": "select"  # Load related products when accessed
        }
    )

class Product(SQLModel, table=True):
    """Product that belongs to a category."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    price: float = Field(sa_column_kwargs={"nullable": False})

    # Foreign key to Category
    category_id: uuid.UUID = Field(foreign_key="category.id", sa_column_kwargs={"nullable": False})

    # Relationship back-reference
    category: Category = Relationship(back_populates="products")
```

## Many-to-One Relationships

### Basic Many-to-One
The inverse of one-to-many relationships:

```python
from sqlmodel import SQLModel, Field, Relationship
import uuid

class Comment(SQLModel, table=True):
    """Comment belongs to one post (many-to-one)."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: str = Field(sa_column_kwargs={"nullable": False})
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Many-to-one: Comment belongs to one Post
    post_id: uuid.UUID = Field(foreign_key="post.id", sa_column_kwargs={"nullable": False})
    post: "Post" = Relationship(back_populates="comments")

class Post(SQLModel, table=True):
    """Post can have many comments (one-to-many)."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False})
    content: str = Field(sa_column_kwargs={"nullable": False})

    # One-to-many: Post has many Comments
    comments: List["Comment"] = Relationship(back_populates="post")
```

## Many-to-Many Relationships

### Simple Many-to-Many
Using an association table for many-to-many relationships:

```python
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Table, Column, ForeignKey
from typing import List
import uuid

# Association table for Tag-Post many-to-many
post_tag_association = Table(
    "post_tag",
    SQLModel.metadata,
    Column("post_id", uuid.UUID, ForeignKey("post.id")),
    Column("tag_id", uuid.UUID, ForeignKey("tag.id"))
)

class Post(SQLModel, table=True):
    """Post can have many tags."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False})
    content: str = Field(sa_column_kwargs={"nullable": False})

    # Many-to-many relationship
    tags: List["Tag"] = Relationship(
        back_populates="posts",
        link_model=post_tag_association
    )

class Tag(SQLModel, table=True):
    """Tag can be associated with many posts."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, sa_column_kwargs={"nullable": False})

    # Many-to-many relationship
    posts: List[Post] = Relationship(
        back_populates="tags",
        link_model=post_tag_association
    )
```

### Many-to-Many with Association Object
When you need additional data in the many-to-many relationship:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List
import uuid

class Course(SQLModel, table=True):
    """Course that students can enroll in."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    code: str = Field(unique=True, sa_column_kwargs={"nullable": False})

    # Many-to-many through Enrollment
    enrollments: List["Enrollment"] = Relationship(back_populates="course")

    # Convenience relationship to get students directly
    students: List["Student"] = Relationship(
        back_populates="courses",
        link_model="Enrollment"
    )

class Student(SQLModel, table=True):
    """Student who can enroll in courses."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    student_id: str = Field(unique=True, sa_column_kwargs={"nullable": False})

    # Many-to-many through Enrollment
    enrollments: List["Enrollment"] = Relationship(back_populates="student")

    # Convenience relationship to get courses directly
    courses: List[Course] = Relationship(
        back_populates="students",
        link_model="Enrollment"
    )

class Enrollment(SQLModel, table=True):
    """Association object for course-student relationship with additional data."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)
    grade: Optional[str] = Field(default=None, max_length=2)  # A+, A, B+, etc.
    status: str = Field(default="enrolled", sa_column_kwargs={"nullable": False})

    # Foreign keys
    student_id: uuid.UUID = Field(foreign_key="student.id", sa_column_kwargs={"nullable": False})
    course_id: uuid.UUID = Field(foreign_key="course.id", sa_column_kwargs={"nullable": False})

    # Relationships
    student: Student = Relationship(back_populates="enrollments")
    course: Course = Relationship(back_populates="enrollments")
```

## Self-Referential Relationships

### Tree Structure
For hierarchical data like categories or organizational structures:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
import uuid

class Category(SQLModel, table=True):
    """Self-referential category for hierarchical structure."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    description: Optional[str] = Field(default=None)

    # Self-referential foreign key
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="category.id")

    # Self-referential relationships
    parent: Optional["Category"] = Relationship(
        sa_relationship_kwargs={
            "remote_side": "Category.id"  # Indicates this is a self-referential relationship
        },
        back_populates="children"
    )
    children: List["Category"] = Relationship(
        back_populates="parent"
    )
```

### Following/Follower Pattern
Common in social applications:

```python
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Table, Column, ForeignKey
from typing import List
import uuid

# Association table for following relationship
following_association = Table(
    "following",
    SQLModel.metadata,
    Column("follower_id", uuid.UUID, ForeignKey("user.id")),
    Column("followed_id", uuid.UUID, ForeignKey("user.id"))
)

class User(SQLModel, table=True):
    """User with following/follower relationships."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(unique=True, sa_column_kwargs={"nullable": False})
    email: str = Field(sa_column_kwargs={"nullable": False})

    # Following relationship (users this user follows)
    following: List["User"] = Relationship(
        back_populates="followers",
        link_model=following_association,
        sa_relationship_kwargs={
            "primaryjoin": "User.id == following.c.follower_id",
            "secondaryjoin": "User.id == following.c.followed_id"
        }
    )

    # Followers relationship (users who follow this user)
    followers: List["User"] = Relationship(
        back_populates="following",
        link_model=following_association,
        sa_relationship_kwargs={
            "primaryjoin": "User.id == following.c.followed_id",
            "secondaryjoin": "User.id == following.c.follower_id"
        }
    )
```

## Advanced Relationship Patterns

### Polymorphic Relationships
When entities can relate to different types of entities:

```python
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Table, Column, ForeignKey, String, Integer
from typing import List, Optional
import uuid

# Association table for polymorphic comments
comment_association = Table(
    "comment_association",
    SQLModel.metadata,
    Column("comment_id", uuid.UUID, ForeignKey("comment.id")),
    Column("commentable_id", uuid.UUID),  # Can reference different tables
    Column("commentable_type", String)   # Type discriminator
)

class Comment(SQLModel, table=True):
    """Comment that can belong to different types of entities."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: str = Field(sa_column_kwargs={"nullable": False})
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Polymorphic relationship - can comment on different entity types
    commentable_id: uuid.UUID
    commentable_type: str  # 'post', 'product', 'user', etc.

class Post(SQLModel, table=True):
    """Post that can have comments."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False})
    content: str = Field(sa_column_kwargs={"nullable": False})

    # Comments on this post
    comments: List[Comment] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "and_("
                           "Post.id == Comment.commentable_id,"
                           "Comment.commentable_type == 'post'"
                           ")"
        }
    )

class Product(SQLModel, table=True):
    """Product that can have comments."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    price: float = Field(sa_column_kwargs={"nullable": False})

    # Reviews/comments on this product
    comments: List[Comment] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "and_("
                           "Product.id == Comment.commentable_id,"
                           "Comment.commentable_type == 'product'"
                           ")"
        }
    )
```

### Relationship Loading Strategies
Control how relationships are loaded to optimize performance:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List
import uuid

class Department(SQLModel, table=True):
    """Department with employees."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})

    # Relationship with explicit loading strategy
    employees: List["Employee"] = Relationship(
        back_populates="department",
        sa_relationship_kwargs={
            "lazy": "select",      # Load when accessed (default)
            # "lazy": "joined",    # Load with JOIN (eager loading)
            # "lazy": "subquery",  # Load with subquery
            # "lazy": "selectin",  # Load with SELECT IN
            # "lazy": "raise",     # Raise error if accessed without loading
        }
    )

class Employee(SQLModel, table=True):
    """Employee belonging to department."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
    position: str = Field(sa_column_kwargs={"nullable": False})

    # Foreign key
    department_id: uuid.UUID = Field(foreign_key="department.id", sa_column_kwargs={"nullable": False})

    # Relationship with loading strategy
    department: Department = Relationship(
        back_populates="employees",
        sa_relationship_kwargs={
            "lazy": "joined"  # Eager load department with employee
        }
    )
```

## Relationship Querying Patterns

### Basic Relationship Queries
How to work with relationships in queries:

```python
from sqlmodel import Session, select
from typing import List

def get_posts_with_author_and_comments(session: Session, author_id: uuid.UUID) -> List[Post]:
    """Get posts with author and comments loaded."""
    # Eager loading with joins
    statement = (
        select(Post)
        .where(Post.author_id == author_id)
        .join(Post.author)
        .join(Post.comments)
    )
    posts = session.exec(statement).all()
    return posts

def get_author_with_posts(session: Session, author_id: uuid.UUID) -> Author:
    """Get author with all their posts."""
    statement = (
        select(Author)
        .where(Author.id == author_id)
        .join(Author.books)  # Load books with author
    )
    author = session.exec(statement).first()
    return author

def get_books_with_categories(session: Session) -> List[Book]:
    """Get books with their categories."""
    statement = (
        select(Book)
        .join(Book.categories)  # Many-to-many relationship
    )
    books = session.exec(statement).all()
    return books
```

These relationship patterns provide a solid foundation for modeling complex data relationships in SQLModel while maintaining good performance and data integrity.