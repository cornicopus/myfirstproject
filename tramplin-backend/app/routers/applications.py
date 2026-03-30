from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app import schemas, models, auth
from app.database import get_db

router = APIRouter(prefix="/applications", tags=["applications"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/", response_model=dict)
async def create_application(
    application: schemas.ApplicationCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can apply")
    
    # Check if opportunity exists and is active
    result = await db.execute(
        select(models.Opportunity).where(
            models.Opportunity.id == application.opportunity_id,
            models.Opportunity.is_active == True
        )
    )
    opportunity = result.scalar_one_or_none()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if already applied
    result = await db.execute(
        select(models.Application).where(
            models.Application.seeker_id == user.id,
            models.Application.opportunity_id == application.opportunity_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    db_application = models.Application(
        seeker_id=user.id,
        opportunity_id=application.opportunity_id,
        cover_letter=application.cover_letter
    )
    db.add(db_application)
    await db.commit()
    
    return {"message": "Application submitted successfully"}

@router.get("/my", response_model=List[dict])
async def get_my_applications(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    
    result = await db.execute(
        select(models.Application)
        .where(models.Application.seeker_id == user.id)
        .options(
            selectinload(models.Application.opportunity)
        )
        .order_by(models.Application.applied_at.desc())
    )
    applications = result.scalars().all()
    
    return [
        {
            "id": app.id,
            "opportunity_id": app.opportunity_id,
            "opportunity_title": app.opportunity.title if app.opportunity else None,
            "company_name": app.opportunity.company.employer_profile.company_name if app.opportunity and app.opportunity.company and app.opportunity.company.employer_profile else None,
            "status": app.status.value,
            "cover_letter": app.cover_letter,
            "applied_at": app.applied_at
        }
        for app in applications
    ]

@router.get("/opportunity/{opportunity_id}")
async def get_applications_for_opportunity(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    
    # Check if user is the employer who owns this opportunity
    result = await db.execute(
        select(models.Opportunity).where(models.Opportunity.id == opportunity_id)
    )
    opportunity = result.scalar_one_or_none()
    if not opportunity or opportunity.company_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(models.Application)
        .where(models.Application.opportunity_id == opportunity_id)
        .options(
            selectinload(models.Application.seeker),
            selectinload(models.Application.seeker).selectinload(models.User.seeker_profile)
        )
        .order_by(models.Application.applied_at.desc())
    )
    applications = result.scalars().all()
    
    return [
        {
            "id": app.id,
            "seeker_id": app.seeker_id,
            "seeker_name": app.seeker.seeker_profile.full_name if app.seeker and app.seeker.seeker_profile else app.seeker.email,
            "seeker_email": app.seeker.email,
            "status": app.status.value,
            "cover_letter": app.cover_letter,
            "applied_at": app.applied_at
        }
        for app in applications
    ]

@router.put("/{application_id}/status")
async def update_application_status(
    application_id: int,
    status: schemas.ApplicationStatus,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    
    result = await db.execute(
        select(models.Application)
        .where(models.Application.id == application_id)
        .options(selectinload(models.Application.opportunity))
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer who owns this opportunity
    if application.opportunity.company_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    application.status = status
    await db.commit()
    
    return {"message": f"Application status updated to {status.value}"}