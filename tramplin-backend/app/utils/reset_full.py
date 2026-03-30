import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.auth import get_password_hash

async def reset_full():
    # Подключаемся к postgres базе
    engine = create_async_engine(
        settings.DATABASE_URL.replace('/tramplin', '/postgres'), 
        isolation_level="AUTOCOMMIT"
    )
    
    async with engine.connect() as conn:
        # Удаляем базу данных
        await conn.execute(text("DROP DATABASE IF EXISTS tramplin"))
        print("✅ База данных удалена")
        
        # Создаем новую
        await conn.execute(text("CREATE DATABASE tramplin"))
        print("✅ База данных создана")
    
    # Подключаемся к новой базе
    engine = create_async_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    async with engine.connect() as conn:
        # Создаем enum типы с маленькими буквами
        await conn.execute(text("CREATE TYPE userrole AS ENUM ('seeker', 'employer', 'curator')"))
        await conn.execute(text("CREATE TYPE opportunitytype AS ENUM ('job', 'internship', 'mentorship', 'event')"))
        await conn.execute(text("CREATE TYPE workformat AS ENUM ('office', 'hybrid', 'remote')"))
        await conn.execute(text("CREATE TYPE applicationstatus AS ENUM ('pending', 'accepted', 'rejected', 'reserve')"))
        print("✅ Enum типы созданы")
        
        # Создаем таблицу users
        await conn.execute(text("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role userrole NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Создаем таблицу seeker_profiles
        await conn.execute(text("""
            CREATE TABLE seeker_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                full_name VARCHAR(255),
                university VARCHAR(255),
                graduation_year INTEGER,
                about TEXT,
                skills JSONB DEFAULT '[]',
                portfolio JSONB DEFAULT '[]',
                privacy_settings JSONB DEFAULT '{"profile_visible": "all", "contacts_visible": "all"}',
                resume_url VARCHAR(500)
            )
        """))
        
        # Создаем таблицу employer_profiles
        await conn.execute(text("""
            CREATE TABLE employer_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                company_name VARCHAR(255) NOT NULL,
                description TEXT,
                industry VARCHAR(100),
                website VARCHAR(255),
                logo_url VARCHAR(500),
                is_verified BOOLEAN DEFAULT FALSE,
                verification_data JSONB
            )
        """))
        
        # Создаем таблицу curator_profiles
        await conn.execute(text("""
            CREATE TABLE curator_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                permissions JSONB DEFAULT '{"can_verify": true, "can_moderate": true}'
            )
        """))
        
        # Создаем таблицу opportunities
        await conn.execute(text("""
            CREATE TABLE opportunities (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                company_id INTEGER REFERENCES users(id) NOT NULL,
                type opportunitytype NOT NULL,
                work_format workformat NOT NULL,
                location_city VARCHAR(100),
                location_address VARCHAR(255),
                lat FLOAT,
                lon FLOAT,
                salary_from INTEGER,
                salary_to INTEGER,
                currency VARCHAR(3) DEFAULT 'RUB',
                publication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                expiry_date TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Создаем таблицу tags
        await conn.execute(text("""
            CREATE TABLE tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                category VARCHAR(50),
                is_system BOOLEAN DEFAULT TRUE
            )
        """))
        
        # Создаем таблицу opportunity_tags
        await conn.execute(text("""
            CREATE TABLE opportunity_tags (
                opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
                tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (opportunity_id, tag_id)
            )
        """))
        
        # Создаем таблицу applications
        await conn.execute(text("""
            CREATE TABLE applications (
                id SERIAL PRIMARY KEY,
                seeker_id INTEGER REFERENCES users(id) NOT NULL,
                opportunity_id INTEGER REFERENCES opportunities(id) NOT NULL,
                status applicationstatus DEFAULT 'pending',
                cover_letter TEXT,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        # Создаем таблицу favorites
        await conn.execute(text("""
            CREATE TABLE favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) NOT NULL,
                opportunity_id INTEGER REFERENCES opportunities(id) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, opportunity_id)
            )
        """))
        
        # Создаем таблицу connections
        await conn.execute(text("""
            CREATE TABLE connections (
                id SERIAL PRIMARY KEY,
                from_seeker_id INTEGER REFERENCES users(id) NOT NULL,
                to_seeker_id INTEGER REFERENCES users(id) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        # Создаем таблицу recommendations
        await conn.execute(text("""
            CREATE TABLE recommendations (
                id SERIAL PRIMARY KEY,
                from_seeker_id INTEGER REFERENCES users(id) NOT NULL,
                to_seeker_id INTEGER REFERENCES users(id) NOT NULL,
                opportunity_id INTEGER REFERENCES opportunities(id) NOT NULL,
                message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        print("✅ Все таблицы созданы")
        
        # Создаем индексы
        await conn.execute(text("CREATE INDEX ix_users_email ON users(email)"))
        await conn.execute(text("CREATE INDEX ix_opportunities_location ON opportunities(lat, lon)"))
        await conn.execute(text("CREATE INDEX ix_opportunities_type ON opportunities(type)"))
        await conn.execute(text("CREATE INDEX ix_applications_seeker ON applications(seeker_id)"))
        print("✅ Индексы созданы")
        
        # Добавляем тестовые данные
        employer_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('company@example.com', :password, 'employer', true)
        """), {"password": employer_hash})
        
        seeker_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('student@example.com', :password, 'seeker', true)
        """), {"password": seeker_hash})
        
        curator_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('curator@example.com', :password, 'curator', true)
        """), {"password": curator_hash})
        
        print("✅ Пользователи созданы")
        
        # Получаем ID работодателя
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'company@example.com'"))
        employer_id = result.fetchone()[0]
        
        # Создаем профиль работодателя
        await conn.execute(text("""
            INSERT INTO employer_profiles (user_id, company_name, description, is_verified)
            VALUES (:user_id, 'ТехноПрогресс', 'IT-компания, занимающаяся разработкой программного обеспечения', true)
        """), {"user_id": employer_id})
        
        # Создаем профиль соискателя
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'student@example.com'"))
        seeker_id = result.fetchone()[0]
        await conn.execute(text("""
            INSERT INTO seeker_profiles (user_id, full_name, university, graduation_year, skills)
            VALUES (:user_id, 'Иван Петров', 'МГУ им. Ломоносова', 2024, '["Python", "JavaScript", "React"]')
        """), {"user_id": seeker_id})
        
        # Добавляем теги
        tags = ['React', 'TypeScript', 'Python', 'Django', 'JavaScript', 'PostgreSQL', 'Java', 'Spring', 'Redux', 'Node.js']
        for tag in tags:
            await conn.execute(text("INSERT INTO tags (name, category) VALUES (:name, 'skill') ON CONFLICT DO NOTHING"), {"name": tag})
        
        # Добавляем вакансии
        opportunities_data = [
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
        
        for opp in opportunities_data:
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
        
        print(f"✅ Добавлено {len(opportunities_data)} вакансий")
        print("\n📋 Тестовые учетные записи:")
        print("   Работодатель: company@example.com / password123")
        print("   Соискатель:   student@example.com / password123")
        print("   Куратор:      curator@example.com / password123")

if __name__ == "__main__":
    asyncio.run(reset_full())