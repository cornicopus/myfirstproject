from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app import crud, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/favorites", tags=["favorites"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/", response_model=List[int])
async def get_favorites(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    favorites = await crud.get_favorites(db, user.id)
    return [fav.opportunity_id for fav in favorites]

@router.post("/toggle/{opportunity_id}", response_model=dict)
async def toggle_favorite(
    opportunity_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await auth.get_current_user(token, db)
    is_added = await crud.toggle_favorite(db, user.id, opportunity_id)
    return {"is_favorite": is_added}