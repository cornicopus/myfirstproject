import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.auth import get_password_hash

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        # Создаем тегов
        tags = ['React', 'TypeScript', 'Python', 'Django', 'JavaScript', 'Node.js', 'PostgreSQL', 'Redux', 'Java', 'Spring']
        for tag in tags:
            await conn.execute(text("""
                INSERT INTO tags (name, category, is_system)
                VALUES (:name, 'skill', true)
                ON CONFLICT (name) DO NOTHING
            """), {"name": tag})
        
        # Создаем работодателя
        employer_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('company@example.com', :password, 'employer', true)
            ON CONFLICT (email) DO NOTHING
        """), {"password": employer_hash})
        
        # Получаем id работодателя
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'company@example.com'"))
        employer_row = result.fetchone()
        
        if employer_row:
            employer_id = employer_row[0]
            
            # Создаем профиль работодателя
            await conn.execute(text("""
                INSERT INTO employer_profiles (user_id, company_name, description, is_verified)
                VALUES (:user_id, 'ТехноПрогресс', 'IT-компания, занимающаяся разработкой программного обеспечения', true)
                ON CONFLICT (user_id) DO NOTHING
            """), {"user_id": employer_id})
            
            # Создаем вакансии
            opportunities = [
                {
                    "title": "Frontend Developer (React)",
                    "description": "Ищем опытного React разработчика. Требования: опыт от 2 лет, знание TypeScript, Redux.",
                    "type": "job",
                    "work_format": "hybrid",
                    "location_city": "Москва",
                    "lat": 55.7558,
                    "lon": 37.6173,
                    "salary_from": 150000,
                    "salary_to": 250000,
                    "tags": ["React", "TypeScript", "Redux", "JavaScript"]
                },
                {
                    "title": "Python Backend Developer",
                    "description": "Разработка высоконагруженных систем на Python. Требования: Django/Flask, PostgreSQL, Redis.",
                    "type": "job",
                    "work_format": "remote",
                    "location_city": "Москва",
                    "lat": 55.7558,
                    "lon": 37.6173,
                    "salary_from": 180000,
                    "salary_to": 280000,
                    "tags": ["Python", "Django", "PostgreSQL"]
                },
                {
                    "title": "Стажировка Frontend Developer",
                    "description": "Стажировка для студентов. Обучение React, работа над реальными проектами.",
                    "type": "internship",
                    "work_format": "office",
                    "location_city": "Москва",
                    "lat": 55.7558,
                    "lon": 37.6173,
                    "salary_from": 50000,
                    "salary_to": 70000,
                    "tags": ["React", "JavaScript", "HTML", "CSS"]
                },
                {
                    "title": "Senior Java Developer",
                    "description": "Разработка высоконагруженных систем на Java. Spring Boot, Hibernate, Kafka.",
                    "type": "job",
                    "work_format": "remote",
                    "location_city": "Санкт-Петербург",
                    "lat": 59.9343,
                    "lon": 30.3351,
                    "salary_from": 250000,
                    "salary_to": 400000,
                    "tags": ["Java", "Spring", "Kafka"]
                },
                {
                    "title": "Карьерный вебинар: Как пройти собеседование",
                    "description": "Бесплатный вебинар по подготовке к техническим собеседованиям.",
                    "type": "event",
                    "work_format": "remote",
                    "location_city": "Онлайн",
                    "lat": 55.7558,
                    "lon": 37.6173,
                    "salary_from": None,
                    "salary_to": None,
                    "tags": ["Карьера", "Собеседование"]
                }
            ]
            
            for opp in opportunities:
                result = await conn.execute(text("""
                    INSERT INTO opportunities (
                        title, description, company_id, type, work_format, 
                        location_city, lat, lon, salary_from, salary_to, is_active
                    ) VALUES (
                        :title, :description, :company_id, :type, :work_format,
                        :location_city, :lat, :lon, :salary_from, :salary_to, true
                    ) RETURNING id
                """), {
                    "title": opp["title"],
                    "description": opp["description"],
                    "company_id": employer_id,
                    "type": opp["type"],
                    "work_format": opp["work_format"],
                    "location_city": opp["location_city"],
                    "lat": opp["lat"],
                    "lon": opp["lon"],
                    "salary_from": opp["salary_from"],
                    "salary_to": opp["salary_to"]
                })
                
                opp_id = result.fetchone()[0]
                
                # Добавляем теги к вакансии
                for tag_name in opp["tags"]:
                    tag_result = await conn.execute(text("SELECT id FROM tags WHERE name = :name"), {"name": tag_name})
                    tag_row = tag_result.fetchone()
                    if tag_row:
                        await conn.execute(text("""
                            INSERT INTO opportunity_tags (opportunity_id, tag_id)
                            VALUES (:opp_id, :tag_id)
                            ON CONFLICT DO NOTHING
                        """), {"opp_id": opp_id, "tag_id": tag_row[0]})
            
            print("✅ Тестовые данные созданы!")
            print(f"📧 Работодатель: company@example.com / password123")
            print(f"📋 Создано {len(opportunities)} вакансий")
        
        # Создаем соискателя
        seeker_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('student@example.com', :password, 'seeker', true)
            ON CONFLICT (email) DO NOTHING
        """), {"password": seeker_hash})
        
        # Получаем id соискателя
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'student@example.com'"))
        seeker_row = result.fetchone()
        if seeker_row:
            await conn.execute(text("""
                INSERT INTO seeker_profiles (user_id, full_name, university, graduation_year, skills)
                VALUES (:user_id, 'Иван Петров', 'МГУ им. Ломоносова', 2024, '["Python", "JavaScript", "React"]')
                ON CONFLICT (user_id) DO NOTHING
            """), {"user_id": seeker_row[0]})
            print(f"👤 Соискатель: student@example.com / password123")
        
        # Создаем куратора
        curator_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('curator@example.com', :password, 'curator', true)
            ON CONFLICT (email) DO NOTHING
        """), {"password": curator_hash})
        print(f"👨‍💼 Куратор: curator@example.com / password123")

if __name__ == "__main__":
    asyncio.run(seed_data())