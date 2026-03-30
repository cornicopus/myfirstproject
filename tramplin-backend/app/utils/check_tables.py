import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def check_tables():
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        """))
        tables = result.fetchall()
        
        print("📋 Таблицы в базе данных:")
        for table in tables:
            print(f"  - {table[0]}")
        
        if tables:
            print(f"\n✅ Всего таблиц: {len(tables)}")
        else:
            print("\n❌ Таблицы не найдены!")

if __name__ == "__main__":
    asyncio.run(check_tables())