from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    SEEKER = "seeker"
    EMPLOYER = "employer"
    CURATOR = "curator"

class OpportunityType(str, Enum):
    JOB = "job"
    INTERNSHIP = "internship"
    MENTORSHIP = "mentorship"
    EVENT = "event"

class WorkFormat(str, Enum):
    OFFICE = "office"
    HYBRID = "hybrid"
    REMOTE = "remote"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    RESERVE = "reserve"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    # Seeker fields
    full_name: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    about: Optional[str] = None
    skills: Optional[List[str]] = None
    # Employer fields
    company_name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    inn: Optional[str] = None
    corporate_email_domain: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Seeker schemas
class SeekerProfileBase(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    about: Optional[str] = None
    skills: Optional[List[str]] = []
    portfolio: Optional[List[str]] = []
    privacy_settings: Optional[dict] = None
    resume_url: Optional[str] = None

class SeekerProfileCreate(SeekerProfileBase):
    pass

class SeekerProfileResponse(SeekerProfileBase):
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

# Employer schemas
class EmployerProfileBase(BaseModel):
    company_name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

class EmployerProfileCreate(EmployerProfileBase):
    inn: Optional[str] = None
    corporate_email_domain: Optional[str] = None

class EmployerProfileResponse(EmployerProfileBase):
    user_id: int
    is_verified: bool
    
    model_config = ConfigDict(from_attributes=True)

# Opportunity schemas
class OpportunityBase(BaseModel):
    title: str
    description: str
    type: OpportunityType
    work_format: WorkFormat
    location_city: Optional[str] = None
    location_address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    currency: str = "RUB"
    expiry_date: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    tags: Optional[List[str]] = []

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[OpportunityType] = None
    work_format: Optional[WorkFormat] = None
    location_city: Optional[str] = None
    location_address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    currency: Optional[str] = None
    expiry_date: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class OpportunityResponse(OpportunityBase):
    id: int
    company_id: int
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    publication_date: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

# Application schemas
class ApplicationCreate(BaseModel):
    opportunity_id: int
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    seeker_id: int
    seeker_name: Optional[str] = None
    opportunity_id: int
    opportunity_title: Optional[str] = None
    status: ApplicationStatus
    cover_letter: Optional[str] = None
    applied_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

# Favorite schemas
class FavoriteResponse(BaseModel):
    id: int
    opportunity_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Connection schemas
class ConnectionCreate(BaseModel):
    to_seeker_id: int

class ConnectionResponse(BaseModel):
    id: int
    from_seeker_id: int
    from_seeker_name: Optional[str] = None
    to_seeker_id: int
    to_seeker_name: Optional[str] = None
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ConnectionUpdate(BaseModel):
    status: str

# Recommendation schemas
class RecommendationCreate(BaseModel):
    to_seeker_id: int
    opportunity_id: int
    message: Optional[str] = None

class RecommendationResponse(BaseModel):
    id: int
    from_seeker_id: int
    from_seeker_name: Optional[str] = None
    to_seeker_id: int
    to_seeker_name: Optional[str] = None
    opportunity_id: int
    opportunity_title: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Filter schemas
class OpportunityFilters(BaseModel):
    search: Optional[str] = None
    skills: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    work_format: Optional[List[WorkFormat]] = None
    type: Optional[List[OpportunityType]] = None
    city: Optional[str] = None

# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int