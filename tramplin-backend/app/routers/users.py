from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app import crud, schemas, auth, models
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/me/seeker-profile", response_model=schemas.SeekerProfileResponse)
async def get_my_seeker_profile(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Not a seeker")
    
    profile = await crud.get_seeker_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile

@router.put("/me/seeker-profile", response_model=schemas.SeekerProfileResponse)
async def update_my_seeker_profile(
    profile_data: schemas.SeekerProfileCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Not a seeker")
    
    profile = await crud.get_seeker_profile(db, user.id)
    if not profile:
        profile = await crud.create_seeker_profile(db, user.id, profile_data)
    
    # Update fields
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/me/employer-profile", response_model=schemas.EmployerProfileResponse)
async def get_my_employer_profile(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Not an employer")
    
    profile = await crud.get_employer_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile

@router.put("/me/employer-profile", response_model=schemas.EmployerProfileResponse)
async def update_my_employer_profile(
    profile_data: schemas.EmployerProfileCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Not an employer")
    
    profile = await crud.get_employer_profile(db, user.id)
    if not profile:
        profile = await crud.create_employer_profile(db, user.id, profile_data)
    
    # Update fields
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/me/applications", response_model=List[schemas.ApplicationResponse])
async def get_my_applications(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    applications = await crud.get_applications_by_seeker(db, user.id)
    
    result = []
    for app in applications:
        result.append(schemas.ApplicationResponse(
            id=app.id,
            seeker_id=app.seeker_id,
            opportunity_id=app.opportunity_id,
            opportunity_title=app.opportunity.title if app.opportunity else None,
            status=app.status,
            cover_letter=app.cover_letter,
            applied_at=app.applied_at
        ))
    return result

@router.get("/me/connections", response_model=List[schemas.ConnectionResponse])
async def get_my_connections(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can have connections")
    
    connections = await crud.get_connections(db, user.id)
    return connections

@router.post("/me/connections", response_model=schemas.ConnectionResponse)
async def create_connection(
    connection: schemas.ConnectionCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can create connections")
    
    conn = await crud.create_connection(db, user.id, connection.to_seeker_id)
    return conn

@router.get("/me/recommendations", response_model=List[schemas.RecommendationResponse])
async def get_my_recommendations(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can receive recommendations")
    
    recommendations = await crud.get_recommendations(db, user.id)
    return recommendations

@router.post("/me/recommendations", response_model=schemas.RecommendationResponse)
async def create_recommendation(
    recommendation: schemas.RecommendationCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != schemas.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can create recommendations")
    
    rec = await crud.create_recommendation(db, user.id, recommendation)
    return rec

@router.get("/seeker/{seeker_id}", response_model=schemas.SeekerProfileResponse)
async def get_seeker_profile_by_id(
    seeker_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    # Куратор и работодатель могут просматривать профили соискателей
    if user.role not in [models.UserRole.EMPLOYER, models.UserRole.CURATOR]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    profile = await crud.get_seeker_profile(db, seeker_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Seeker profile not found")
    
    return profile