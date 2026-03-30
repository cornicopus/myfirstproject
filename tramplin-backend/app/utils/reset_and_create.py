import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.database import Base
from app import models

async def reset_and_create():
    # 1. Удаляем базу данных
    engine = create_async_engine(
        settings.DATABASE_URL.replace('/tramplin', '/postgres'),
        isolation_level="AUTOCOMMIT"
    )
    
    async with engine.connect() as conn:
        print("🗑️ Удаляем базу данных tramplin...")
        await conn.execute(text("DROP DATABASE IF EXISTS tramplin"))
        print("✅ База данных удалена")
        
        print("📦 Создаем новую базу данных tramplin...")
        await conn.execute(text("CREATE DATABASE tramplin"))
        print("✅ База данных создана")
    
    # 2. Создаем таблицы через SQLAlchemy
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        print("📋 Создаем таблицы...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Таблицы созданы")
    
    print("🎉 База данных готова к заполнению!")

if __name__ == "__main__":
    asyncio.run(reset_and_create())