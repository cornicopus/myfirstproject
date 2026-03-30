import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def create_enum():
    engine = create_async_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    async with engine.connect() as conn:
        # Создаем enum тип
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE userrole AS ENUM ('seeker', 'employer', 'curator');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        print("✅ Enum userrole создан")
        
        # Создаем enum для типов вакансий
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE opportunitytype AS ENUM ('job', 'internship', 'mentorship', 'event');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        print("✅ Enum opportunitytype создан")
        
        # Создаем enum для формата работы
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE workformat AS ENUM ('office', 'hybrid', 'remote');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        print("✅ Enum workformat создан")
        
        # Создаем enum для статуса отклика
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE applicationstatus AS ENUM ('pending', 'accepted', 'rejected', 'reserve');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        print("✅ Enum applicationstatus создан")

if __name__ == "__main__":
    asyncio.run(create_enum())