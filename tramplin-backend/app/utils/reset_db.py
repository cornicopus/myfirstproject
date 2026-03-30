import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def reset_database():
    # Подключаемся к postgres базе (не к tramplin)
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
    
    print("🎉 База данных полностью сброшена!")

if __name__ == "__main__":
    asyncio.run(reset_database())