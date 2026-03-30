from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List
from app import schemas, auth, models
from app.database import get_db

router = APIRouter(prefix="/curator", tags=["curator"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/pending-employers")
async def get_pending_employers(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile)
        .where(models.EmployerProfile.is_verified == False)
        .options(selectinload(models.EmployerProfile.user))
    )
    employers = result.scalars().all()
    
    return [
        {
            "id": emp.id,
            "user_id": emp.user_id,
            "company_name": emp.company_name,
            "description": emp.description,
            "industry": emp.industry,
            "website": emp.website,
            "is_verified": emp.is_verified,
            "verification_data": emp.verification_data,
            "user": {
                "email": emp.user.email,
                "created_at": emp.user.created_at
            } if emp.user else None
        }
        for emp in employers
    ]

@router.get("/employer/{employer_id}")
async def get_employer_details(
    employer_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile)
        .where(models.EmployerProfile.user_id == employer_id)
        .options(selectinload(models.EmployerProfile.user))
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "company_name": emp.company_name,
        "description": emp.description,
        "industry": emp.industry,
        "website": emp.website,
        "is_verified": emp.is_verified,
        "verification_data": emp.verification_data,
        "user": {
            "email": emp.user.email,
            "created_at": emp.user.created_at
        } if emp.user else None
    }

@router.post("/verify-employer/{employer_id}")
async def verify_employer(
    employer_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == employer_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    profile.is_verified = True
    await db.commit()
    
    return {"message": "Employer verified successfully"}

@router.post("/reject-employer/{employer_id}")
async def reject_employer(
    employer_id: int,
    reason: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == employer_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    # Здесь можно добавить логику для отклонения (например, удалить или пометить)
    # Пока просто удаляем
    await db.delete(profile)
    await db.commit()
    
    return {"message": f"Employer rejected: {reason}"}

@router.get("/opportunities/pending")
async def get_pending_opportunities(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.Opportunity)
        .where(models.Opportunity.is_active == True)
        .options(
            selectinload(models.Opportunity.company).selectinload(models.User.employer_profile)
        )
    )
    opportunities = result.scalars().all()
    
    # Фильтруем только те, где компания не верифицирована
    pending = [
        opp for opp in opportunities 
        if not opp.company.employer_profile or not opp.company.employer_profile.is_verified
    ]
    
    return [
        {
            "id": opp.id,
            "title": opp.title,
            "description": opp.description,
            "company_name": opp.company.employer_profile.company_name if opp.company and opp.company.employer_profile else None,
            "location_city": opp.location_city,
            "work_format": opp.work_format.value,
            "is_active": opp.is_active
        }
        for opp in pending
    ]

@router.post("/opportunities/{opportunity_id}/approve")
async def approve_opportunity(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(select(models.Opportunity).where(models.Opportunity.id == opportunity_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Вакансия уже активна, просто подтверждаем
    opp.is_active = True
    await db.commit()
    
    return {"message": "Opportunity approved successfully"}

@router.post("/opportunities/{opportunity_id}/reject")
async def reject_opportunity(
    opportunity_id: int,
    reason: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(select(models.Opportunity).where(models.Opportunity.id == opportunity_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opp.is_active = False
    await db.commit()
    
    return {"message": f"Opportunity rejected: {reason}"}

@router.get("/employers/all")
async def get_all_employers(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile)
        .options(selectinload(models.EmployerProfile.user))
        .order_by(models.EmployerProfile.created_at.desc())
    )
    employers = result.scalars().all()
    
    return [
        {
            "id": emp.id,
            "user_id": emp.user_id,
            "company_name": emp.company_name,
            "description": emp.description,
            "industry": emp.industry,
            "website": emp.website,
            "is_verified": emp.is_verified,
            "verification_data": emp.verification_data,
            "created_at": emp.created_at,
            "user": {
                "email": emp.user.email,
                "created_at": emp.user.created_at
            } if emp.user else None
        }
        for emp in employers
    ]

@router.get("/opportunities/all")
async def get_all_opportunities(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.Opportunity)
        .options(
            selectinload(models.Opportunity.company).selectinload(models.User.employer_profile)
        )
        .order_by(models.Opportunity.created_at.desc())
    )
    opportunities = result.scalars().all()
    
    return [
        {
            "id": opp.id,
            "title": opp.title,
            "description": opp.description,
            "type": opp.type.value,
            "work_format": opp.work_format.value,
            "location_city": opp.location_city,
            "salary_from": opp.salary_from,
            "salary_to": opp.salary_to,
            "is_active": opp.is_active,
            "created_at": opp.created_at,
            "company_name": opp.company.employer_profile.company_name if opp.company and opp.company.employer_profile else None,
            "company_id": opp.company_id
        }
        for opp in opportunities
    ]

# ============ УПРАВЛЕНИЕ КОМПАНИЯМИ ============

@router.put("/employer/{employer_id}")
async def update_employer(
    employer_id: int,
    employer_data: dict,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == employer_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    # Обновляем поля
    for field, value in employer_data.items():
        if hasattr(profile, field) and value is not None:
            setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return {"message": "Company updated successfully", "company": {
        "id": profile.id,
        "user_id": profile.user_id,
        "company_name": profile.company_name,
        "description": profile.description,
        "industry": profile.industry,
        "website": profile.website,
        "is_verified": profile.is_verified
    }}

@router.delete("/employer/{employer_id}")
async def delete_employer(
    employer_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    # Находим профиль компании
    result = await db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.user_id == employer_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    # Удаляем все вакансии компании
    await db.execute(
        delete(models.Opportunity).where(models.Opportunity.company_id == employer_id)
    )
    
    # Удаляем профиль компании
    await db.delete(profile)
    
    # Удаляем пользователя
    user_result = await db.execute(
        select(models.User).where(models.User.id == employer_id)
    )
    user_to_delete = user_result.scalar_one_or_none()
    if user_to_delete:
        await db.delete(user_to_delete)
    
    await db.commit()
    
    return {"message": f"Company '{profile.company_name}' and all its vacancies deleted successfully"}

# ============ УПРАВЛЕНИЕ ВАКАНСИЯМИ ============

@router.put("/opportunity/{opportunity_id}")
async def update_opportunity(
    opportunity_id: int,
    opportunity_data: dict,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.Opportunity).where(models.Opportunity.id == opportunity_id)
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Обновляем поля
    for field, value in opportunity_data.items():
        if hasattr(opp, field) and value is not None:
            # Для enum полей нужно преобразовать
            if field == 'type' and value:
                opp.type = value
            elif field == 'work_format' and value:
                opp.work_format = value
            else:
                setattr(opp, field, value)
    
    await db.commit()
    await db.refresh(opp)
    
    return {"message": "Opportunity updated successfully", "opportunity": {
        "id": opp.id,
        "title": opp.title,
        "description": opp.description,
        "type": opp.type.value,
        "work_format": opp.work_format.value,
        "location_city": opp.location_city,
        "salary_from": opp.salary_from,
        "salary_to": opp.salary_to,
        "is_active": opp.is_active
    }}

@router.delete("/opportunity/{opportunity_id}")
async def delete_opportunity(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.Opportunity).where(models.Opportunity.id == opportunity_id)
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Удаляем связанные теги
    await db.execute(
        delete(models.OpportunityTag).where(models.OpportunityTag.opportunity_id == opportunity_id)
    )
    
    # Удаляем связанные отклики
    await db.execute(
        delete(models.Application).where(models.Application.opportunity_id == opportunity_id)
    )
    
    # Удаляем из избранного
    await db.execute(
        delete(models.Favorite).where(models.Favorite.opportunity_id == opportunity_id)
    )
    
    # Удаляем вакансию
    await db.delete(opp)
    await db.commit()
    
    return {"message": f"Vacancy '{opp.title}' deleted successfully"}

@router.put("/employer/{employer_id}/toggle-active")
async def toggle_employer_active(
    employer_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    # Находим пользователя-работодателя
    result = await db.execute(
        select(models.User).where(models.User.id == employer_id, models.User.role == models.UserRole.EMPLOYER)
    )
    employer = result.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    # Переключаем статус
    employer.is_active = not employer.is_active
    
    # Если деактивируем компанию, деактивируем все её вакансии
    if not employer.is_active:
        await db.execute(
            update(models.Opportunity)
            .where(models.Opportunity.company_id == employer_id)
            .values(is_active=False)
        )
    
    await db.commit()
    
    return {
        "message": f"Company {'activated' if employer.is_active else 'deactivated'} successfully",
        "is_active": employer.is_active
    }

@router.put("/opportunity/{opportunity_id}/toggle-active")
async def toggle_opportunity_active(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    if user.role != models.UserRole.CURATOR:
        raise HTTPException(status_code=403, detail="Only curators can access this")
    
    result = await db.execute(
        select(models.Opportunity).where(models.Opportunity.id == opportunity_id)
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Переключаем статус
    opp.is_active = not opp.is_active
    await db.commit()
    
    return {
        "message": f"Vacancy {'activated' if opp.is_active else 'deactivated'} successfully",
        "is_active": opp.is_active
    }