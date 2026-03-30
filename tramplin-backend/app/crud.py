from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple
from datetime import datetime
from app import models, schemas
from app.auth import get_password_hash


# User CRUD
async def create_user(db: AsyncSession, user_data: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[models.User]:
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[models.User]:
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalar_one_or_none()


# Seeker Profile CRUD
async def create_seeker_profile(db: AsyncSession, user_id: int, profile_data: schemas.SeekerProfileCreate = None) -> models.SeekerProfile:
    if profile_data is None:
        profile_data = schemas.SeekerProfileCreate()
    
    db_profile = models.SeekerProfile(
        user_id=user_id,
        **profile_data.model_dump(exclude_unset=True)
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile


async def get_seeker_profile(db: AsyncSession, user_id: int) -> Optional[models.SeekerProfile]:
    result = await db.execute(
        select(models.SeekerProfile).where(models.SeekerProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


# Employer Profile CRUD
async def create_employer_profile(db: AsyncSession, user_id: int, profile_data: schemas.EmployerProfileCreate) -> models.EmployerProfile:
    db_profile = models.EmployerProfile(
        user_id=user_id,
        company_name=profile_data.company_name,
        description=profile_data.description,
        industry=profile_data.industry,
        website=profile_data.website,
        logo_url=profile_data.logo_url
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile


async def get_employer_profile(db: AsyncSession, user_id: int) -> Optional[models.EmployerProfile]:
    result = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()

# Opportunity CRUD
async def create_opportunity(db: AsyncSession, company_id: int, opp_data: schemas.OpportunityCreate) -> models.Opportunity:
    db_opp = models.Opportunity(
        company_id=company_id,
        title=opp_data.title,
        description=opp_data.description,
        type=opp_data.type,
        work_format=opp_data.work_format,
        location_city=opp_data.location_city,
        location_address=opp_data.location_address,
        lat=opp_data.lat,
        lon=opp_data.lon,
        salary_from=opp_data.salary_from,
        salary_to=opp_data.salary_to,
        currency=opp_data.currency,
        expiry_date=opp_data.expiry_date,
        contact_email=opp_data.contact_email,
        contact_phone=opp_data.contact_phone
    )
    db.add(db_opp)
    await db.flush()
    
    # Add tags
    for tag_name in opp_data.tags or []:
        # Get or create tag
        result = await db.execute(select(models.Tag).where(models.Tag.name == tag_name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = models.Tag(name=tag_name, category="skill", is_system=False)
            db.add(tag)
            await db.flush()
        
        opp_tag = models.OpportunityTag(opportunity_id=db_opp.id, tag_id=tag.id)
        db.add(opp_tag)
    
    await db.commit()
    await db.refresh(db_opp)
    return db_opp

async def get_opportunities(
    db: AsyncSession,
    bounds: Optional[dict] = None,
    filters: Optional[schemas.OpportunityFilters] = None,
    page: int = 1,
    limit: int = 20
) -> Tuple[List[models.Opportunity], int]:
    query = select(models.Opportunity).where(models.Opportunity.is_active == True)
    
    # Bounds filter
    if bounds:
        query = query.where(
            and_(
                models.Opportunity.lat.between(bounds['south'], bounds['north']),
                models.Opportunity.lon.between(bounds['west'], bounds['east'])
            )
        )
    
    # Text search
    if filters and filters.search:
        query = query.where(
            or_(
                models.Opportunity.title.ilike(f"%{filters.search}%"),
                models.Opportunity.description.ilike(f"%{filters.search}%")
            )
        )
    
    # Salary filter
    if filters:
        if filters.salary_min:
            query = query.where(models.Opportunity.salary_from >= filters.salary_min)
        if filters.salary_max:
            query = query.where(models.Opportunity.salary_to <= filters.salary_max)
        
        # Work format filter
        if filters.work_format:
            query = query.where(models.Opportunity.work_format.in_(filters.work_format))
        
        # Type filter
        if filters.type:
            query = query.where(models.Opportunity.type.in_(filters.type))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    query = query.options(selectinload(models.Opportunity.tags).selectinload(models.OpportunityTag.tag))
    
    result = await db.execute(query)
    opportunities = result.scalars().all()
    
    return opportunities, total

async def get_opportunity_by_id(db: AsyncSession, opp_id: int) -> Optional[models.Opportunity]:
    result = await db.execute(
        select(models.Opportunity)
        .where(models.Opportunity.id == opp_id)
        .options(selectinload(models.Opportunity.tags).selectinload(models.OpportunityTag.tag))
    )
    return result.scalar_one_or_none()

async def update_opportunity(db: AsyncSession, opp_id: int, opp_data: schemas.OpportunityUpdate) -> Optional[models.Opportunity]:
    result = await db.execute(select(models.Opportunity).where(models.Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        return None
    
    update_data = opp_data.model_dump(exclude_unset=True, exclude={'tags'})
    for field, value in update_data.items():
        setattr(opp, field, value)
    
    # Update tags if provided
    if opp_data.tags is not None:
        # Remove old tags
        await db.execute(
            select(models.OpportunityTag).where(models.OpportunityTag.opportunity_id == opp_id)
        )
        # Add new tags
        for tag_name in opp_data.tags:
            result = await db.execute(select(models.Tag).where(models.Tag.name == tag_name))
            tag = result.scalar_one_or_none()
            if not tag:
                tag = models.Tag(name=tag_name, category="skill", is_system=False)
                db.add(tag)
                await db.flush()
            opp_tag = models.OpportunityTag(opportunity_id=opp_id, tag_id=tag.id)
            db.add(opp_tag)
    
    await db.commit()
    await db.refresh(opp)
    return opp

# Application CRUD
async def create_application(db: AsyncSession, seeker_id: int, app_data: schemas.ApplicationCreate) -> models.Application:
    db_app = models.Application(
        seeker_id=seeker_id,
        opportunity_id=app_data.opportunity_id,
        cover_letter=app_data.cover_letter
    )
    db.add(db_app)
    await db.commit()
    await db.refresh(db_app)
    return db_app

async def get_applications_by_opportunity(db: AsyncSession, opportunity_id: int) -> List[models.Application]:
    result = await db.execute(
        select(models.Application)
        .where(models.Application.opportunity_id == opportunity_id)
        .options(selectinload(models.Application.seeker))
    )
    return result.scalars().all()

async def get_applications_by_seeker(db: AsyncSession, seeker_id: int) -> List[models.Application]:
    result = await db.execute(
        select(models.Application)
        .where(models.Application.seeker_id == seeker_id)
        .options(selectinload(models.Application.opportunity))
    )
    return result.scalars().all()

async def update_application_status(db: AsyncSession, app_id: int, status: schemas.ApplicationStatus) -> Optional[models.Application]:
    result = await db.execute(select(models.Application).where(models.Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        return None
    app.status = status
    await db.commit()
    await db.refresh(app)
    return app

# Favorite CRUD
async def toggle_favorite(db: AsyncSession, user_id: int, opportunity_id: int) -> bool:
    result = await db.execute(
        select(models.Favorite).where(
            and_(
                models.Favorite.user_id == user_id,
                models.Favorite.opportunity_id == opportunity_id
            )
        )
    )
    fav = result.scalar_one_or_none()
    
    if fav:
        await db.delete(fav)
        await db.commit()
        return False  # Removed
    else:
        db_fav = models.Favorite(user_id=user_id, opportunity_id=opportunity_id)
        db.add(db_fav)
        await db.commit()
        return True  # Added

async def get_favorites(db: AsyncSession, user_id: int) -> List[models.Favorite]:
    result = await db.execute(
        select(models.Favorite)
        .where(models.Favorite.user_id == user_id)
        .options(selectinload(models.Favorite.opportunity))
    )
    return result.scalars().all()

# Connection CRUD
async def create_connection(db: AsyncSession, from_seeker_id: int, to_seeker_id: int) -> models.Connection:
    db_conn = models.Connection(
        from_seeker_id=from_seeker_id,
        to_seeker_id=to_seeker_id,
        status="pending"
    )
    db.add(db_conn)
    await db.commit()
    await db.refresh(db_conn)
    return db_conn

async def update_connection_status(db: AsyncSession, conn_id: int, status: str) -> Optional[models.Connection]:
    result = await db.execute(select(models.Connection).where(models.Connection.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        return None
    conn.status = status
    await db.commit()
    await db.refresh(conn)
    return conn

async def get_connections(db: AsyncSession, seeker_id: int) -> List[models.Connection]:
    result = await db.execute(
        select(models.Connection).where(
            or_(
                models.Connection.from_seeker_id == seeker_id,
                models.Connection.to_seeker_id == seeker_id
            )
        )
    )
    return result.scalars().all()

# Recommendation CRUD
async def create_recommendation(db: AsyncSession, from_seeker_id: int, rec_data: schemas.RecommendationCreate) -> models.Recommendation:
    db_rec = models.Recommendation(
        from_seeker_id=from_seeker_id,
        to_seeker_id=rec_data.to_seeker_id,
        opportunity_id=rec_data.opportunity_id,
        message=rec_data.message
    )
    db.add(db_rec)
    await db.commit()
    await db.refresh(db_rec)
    return db_rec

async def get_recommendations(db: AsyncSession, seeker_id: int) -> List[models.Recommendation]:
    result = await db.execute(
        select(models.Recommendation)
        .where(models.Recommendation.to_seeker_id == seeker_id)
        .options(
            selectinload(models.Recommendation.from_seeker),
            selectinload(models.Recommendation.opportunity)
        )
    )
    return result.scalars().all()