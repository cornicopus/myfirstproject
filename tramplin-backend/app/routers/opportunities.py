from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app import schemas, auth, models
from app.database import get_db

router = APIRouter(prefix="/opportunities", tags=["opportunities"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/", response_model=schemas.PaginatedResponse)
async def get_opportunities(
    north: Optional[float] = Query(None),
    south: Optional[float] = Query(None),
    east: Optional[float] = Query(None),
    west: Optional[float] = Query(None),
    search: Optional[str] = None,
    skills: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    work_format: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(models.Opportunity).where(models.Opportunity.is_active == True)
    
    query = query.options(
        selectinload(models.Opportunity.tags).selectinload(models.OpportunityTag.tag),
        selectinload(models.Opportunity.company).selectinload(models.User.employer_profile)
    )
    
    # Bounds filter
    if all([north, south, east, west]):
        query = query.where(
            and_(
                models.Opportunity.lat.between(south, north),
                models.Opportunity.lon.between(west, east)
            )
        )
    
    # Text search
    if search:
        query = query.where(
            or_(
                models.Opportunity.title.ilike(f"%{search}%"),
                models.Opportunity.description.ilike(f"%{search}%")
            )
        )
    
    # Salary filter
    if salary_min:
        query = query.where(models.Opportunity.salary_from >= salary_min)
    if salary_max:
        query = query.where(models.Opportunity.salary_to <= salary_max)
    
    # Work format filter - множественный выбор
    if work_format:
        formats = [f.strip() for f in work_format.split(",")]
        query = query.where(models.Opportunity.work_format.in_(formats))
    
    # Type filter - множественный выбор
    if type:
        types = [t.strip() for t in type.split(",")]
        query = query.where(models.Opportunity.type.in_(types))
    
    # Skills filter - множественный выбор (через теги)
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        # Используем OR для нескольких навыков
        subquery = select(models.OpportunityTag.opportunity_id).join(models.Tag).where(
            models.Tag.name.in_(skill_list)
        )
        query = query.where(models.Opportunity.id.in_(subquery))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    opportunities = result.scalars().all()
    
    # Формируем ответ
    items = []
    for opp in opportunities:
        tags = [ot.tag.name for ot in opp.tags] if opp.tags else []
        company_name = None
        company_logo = None
        if opp.company and opp.company.employer_profile:
            company_name = opp.company.employer_profile.company_name
            company_logo = opp.company.employer_profile.logo_url
        
        items.append({
            "id": opp.id,
            "title": opp.title,
            "description": opp.description,
            "type": opp.type.value,
            "work_format": opp.work_format.value,
            "location_city": opp.location_city,
            "location_address": opp.location_address,
            "lat": opp.lat,
            "lon": opp.lon,
            "salary_from": opp.salary_from,
            "salary_to": opp.salary_to,
            "currency": opp.currency,
            "publication_date": opp.publication_date,
            "expiry_date": opp.expiry_date,
            "is_active": opp.is_active,
            "contact_email": opp.contact_email,
            "contact_phone": opp.contact_phone,
            "tags": tags,
            "company_id": opp.company_id,
            "company_name": company_name,
            "company_logo": company_logo
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: int, db: AsyncSession = Depends(get_db)):
    query = select(models.Opportunity).where(models.Opportunity.id == opportunity_id)
    query = query.options(
        selectinload(models.Opportunity.tags).selectinload(models.OpportunityTag.tag),
        selectinload(models.Opportunity.company).selectinload(models.User.employer_profile)
    )
    
    result = await db.execute(query)
    opp = result.scalar_one_or_none()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    tags = [ot.tag.name for ot in opp.tags] if opp.tags else []
    company_name = None
    company_logo = None
    company_description = None
    if opp.company and opp.company.employer_profile:
        company_name = opp.company.employer_profile.company_name
        company_logo = opp.company.employer_profile.logo_url
        company_description = opp.company.employer_profile.description
    
    return {
        "id": opp.id,
        "title": opp.title,
        "description": opp.description,
        "type": opp.type.value,
        "work_format": opp.work_format.value,
        "location_city": opp.location_city,
        "location_address": opp.location_address,
        "lat": opp.lat,
        "lon": opp.lon,
        "salary_from": opp.salary_from,
        "salary_to": opp.salary_to,
        "currency": opp.currency,
        "publication_date": opp.publication_date,
        "expiry_date": opp.expiry_date,
        "is_active": opp.is_active,
        "contact_email": opp.contact_email,
        "contact_phone": opp.contact_phone,
        "tags": tags,
        "company_id": opp.company_id,
        "company_name": company_name,
        "company_logo": company_logo,
        "company_description": company_description
    }

@router.post("/", response_model=dict)
async def create_opportunity(
    opportunity: schemas.OpportunityCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can create opportunities")
    
    employer_profile = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == user.id)
    )
    employer = employer_profile.scalar_one_or_none()
    if not employer or not employer.is_verified:
        raise HTTPException(status_code=403, detail="Employer must be verified to create opportunities")
    
    db_opp = models.Opportunity(
        title=opportunity.title,
        description=opportunity.description,
        company_id=user.id,
        type=opportunity.type,
        work_format=opportunity.work_format,
        location_city=opportunity.location_city,
        location_address=opportunity.location_address,
        lat=opportunity.lat,
        lon=opportunity.lon,
        salary_from=opportunity.salary_from,
        salary_to=opportunity.salary_to,
        currency=opportunity.currency,
        expiry_date=opportunity.expiry_date,
        contact_email=opportunity.contact_email,
        contact_phone=opportunity.contact_phone,
        is_active=True
    )
    db.add(db_opp)
    await db.flush()
    
    # Add tags
    for tag_name in opportunity.tags or []:
        result = await db.execute(select(models.Tag).where(models.Tag.name == tag_name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = models.Tag(name=tag_name, category="skill", is_system=False)
            db.add(tag)
            await db.flush()
        
        opp_tag = models.OpportunityTag(opportunity_id=db_opp.id, tag_id=tag.id)
        db.add(opp_tag)
    
    await db.commit()
    
    return {"id": db_opp.id, "message": "Opportunity created successfully"}

@router.put("/{opportunity_id}")
async def update_opportunity(
    opportunity_id: int,
    opportunity: schemas.OpportunityUpdate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    
    result = await db.execute(select(models.Opportunity).where(models.Opportunity.id == opportunity_id))
    opp = result.scalar_one_or_none()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp.company_id != user.id:
        raise HTTPException(status_code=403, detail="You can only update your own opportunities")
    
    update_data = opportunity.model_dump(exclude_unset=True, exclude={'tags'})
    for field, value in update_data.items():
        setattr(opp, field, value)
    
    # Update tags if provided
    if opportunity.tags is not None:
        await db.execute(
            models.OpportunityTag.__table__.delete().where(
                models.OpportunityTag.opportunity_id == opportunity_id
            )
        )
        
        for tag_name in opportunity.tags:
            result = await db.execute(select(models.Tag).where(models.Tag.name == tag_name))
            tag = result.scalar_one_or_none()
            if not tag:
                tag = models.Tag(name=tag_name, category="skill", is_system=False)
                db.add(tag)
                await db.flush()
            opp_tag = models.OpportunityTag(opportunity_id=opportunity_id, tag_id=tag.id)
            db.add(opp_tag)
    
    await db.commit()
    
    return {"message": "Opportunity updated successfully"}

@router.delete("/{opportunity_id}")
async def delete_opportunity(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    
    result = await db.execute(select(models.Opportunity).where(models.Opportunity.id == opportunity_id))
    opp = result.scalar_one_or_none()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp.company_id != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own opportunities")
    
    opp.is_active = False
    await db.commit()
    
    return {"message": "Opportunity deleted successfully"}