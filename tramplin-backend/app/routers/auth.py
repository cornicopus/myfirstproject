from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from jose import JWTError, jwt
from app import crud, schemas, auth, models
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=schemas.UserResponse)
async def register(user_data: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing_user = await crud.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    db_user = await crud.create_user(db, user_data)
    
    # Create profile based on role
    if user_data.role == models.UserRole.SEEKER:
        await crud.create_seeker_profile(db, db_user.id, schemas.SeekerProfileCreate(
            full_name=user_data.full_name,
            university=user_data.university,
            graduation_year=user_data.graduation_year,
            about=user_data.about,
            skills=user_data.skills
        ))
    elif user_data.role == models.UserRole.EMPLOYER:
        await crud.create_employer_profile(db, db_user.id, schemas.EmployerProfileCreate(
            company_name=user_data.company_name,
            description=user_data.description,
            industry=user_data.industry,
            website=user_data.website,
            logo_url=None
        ))
        
        # Если есть ИНН, добавляем в verification_data для последующей верификации
        if hasattr(user_data, 'inn') and user_data.inn:
            employer_profile = await crud.get_employer_profile(db, db_user.id)
            if employer_profile:
                employer_profile.verification_data = {
                    "inn": user_data.inn,
                    "corporate_email_domain": getattr(user_data, 'corporate_email_domain', None)
                }
                await db.commit()
    
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role.value
        }
    }

@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await crud.get_user_by_id(db, int(user_id))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = auth.create_access_token(data={"sub": str(user.id)})
        new_refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(token, db)
    return user