from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    SEEKER = "seeker"
    EMPLOYER = "employer"
    CURATOR = "curator"


class OpportunityType(str, enum.Enum):
    JOB = "job"
    INTERNSHIP = "internship"
    MENTORSHIP = "mentorship"
    EVENT = "event"


class WorkFormat(str, enum.Enum):
    OFFICE = "office"
    HYBRID = "hybrid"
    REMOTE = "remote"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    RESERVE = "reserve"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    seeker_profile = relationship("SeekerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employer_profile = relationship("EmployerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    curator_profile = relationship("CuratorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    opportunities = relationship("Opportunity", back_populates="company", foreign_keys="Opportunity.company_id")
    applications = relationship("Application", back_populates="seeker")
    favorites = relationship("Favorite", back_populates="user")
    sent_connections = relationship("Connection", foreign_keys="Connection.from_seeker_id", back_populates="from_seeker")
    received_connections = relationship("Connection", foreign_keys="Connection.to_seeker_id", back_populates="to_seeker")
    sent_recommendations = relationship("Recommendation", foreign_keys="Recommendation.from_seeker_id", back_populates="from_seeker")
    received_recommendations = relationship("Recommendation", foreign_keys="Recommendation.to_seeker_id", back_populates="to_seeker")


class SeekerProfile(Base):
    __tablename__ = "seeker_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255))
    university = Column(String(255))
    graduation_year = Column(Integer)
    about = Column(Text)
    skills = Column(JSON, default=list)
    portfolio = Column(JSON, default=list)
    privacy_settings = Column(JSON, default={"profile_visible": "all", "contacts_visible": "all"})
    resume_url = Column(String(500))
    
    user = relationship("User", back_populates="seeker_profile")


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    description = Column(Text)
    industry = Column(String(100))
    website = Column(String(255))
    logo_url = Column(String(500))
    is_verified = Column(Boolean, default=False)
    verification_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="employer_profile")


class CuratorProfile(Base):
    __tablename__ = "curator_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    permissions = Column(JSON, default={"can_verify": True, "can_moderate": True})
    
    user = relationship("User", back_populates="curator_profile")


class Opportunity(Base):
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    company_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(OpportunityType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    work_format = Column(Enum(WorkFormat, values_callable=lambda x: [e.value for e in x]), nullable=False)
    location_city = Column(String(100))
    location_address = Column(String(255))
    lat = Column(Float)
    lon = Column(Float)
    salary_from = Column(Integer)
    salary_to = Column(Integer)
    currency = Column(String(3), default="RUB")
    publication_date = Column(DateTime(timezone=True), server_default=func.now())
    expiry_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    company = relationship("User", back_populates="opportunities")
    tags = relationship("OpportunityTag", back_populates="opportunity", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="opportunity", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    category = Column(String(50))
    is_system = Column(Boolean, default=True)
    
    opportunities = relationship("OpportunityTag", back_populates="tag")


class OpportunityTag(Base):
    __tablename__ = "opportunity_tags"
    
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    
    opportunity = relationship("Opportunity", back_populates="tags")
    tag = relationship("Tag", back_populates="opportunities")


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False)
    status = Column(Enum(ApplicationStatus, values_callable=lambda x: [e.value for e in x]), default=ApplicationStatus.PENDING)
    cover_letter = Column(Text)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    
    seeker = relationship("User", back_populates="applications")
    opportunity = relationship("Opportunity", back_populates="applications")


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="favorites")
    opportunity = relationship("Opportunity", back_populates="favorites")


class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True)
    from_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    from_seeker = relationship("User", foreign_keys=[from_seeker_id], back_populates="sent_connections")
    to_seeker = relationship("User", foreign_keys=[to_seeker_id], back_populates="received_connections")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    from_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False)
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    from_seeker = relationship("User", foreign_keys=[from_seeker_id], back_populates="sent_recommendations")
    to_seeker = relationship("User", foreign_keys=[to_seeker_id], back_populates="received_recommendations")
    opportunity = relationship("Opportunity")