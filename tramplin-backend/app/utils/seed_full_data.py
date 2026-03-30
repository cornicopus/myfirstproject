import asyncio
import random
import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.auth import get_password_hash

# Список компаний
COMPANIES = [
    {"name": "Яндекс", "industry": "IT, Поисковые системы", "description": "Крупнейшая IT-компания России, разрабатывающая поисковые системы, карты, такси и множество других сервисов.", "website": "https://yandex.ru"},
    {"name": "Тинькофф", "industry": "Финансы, IT", "description": "Экосистема финансовых и технологических сервисов.", "website": "https://tinkoff.ru"},
    {"name": "Сбер", "industry": "Финансы, IT", "description": "Крупнейший банк России, развивающий IT-направление.", "website": "https://sberbank.ru"},
    {"name": "VK", "industry": "IT, Социальные сети", "description": "Технологическая компания, развивающая социальные сети и сервисы.", "website": "https://vk.com"},
    {"name": "Ozon", "industry": "E-commerce, IT", "description": "Маркетплейс и IT-компания.", "website": "https://ozon.ru"},
    {"name": "Wildberries", "industry": "E-commerce, IT", "description": "Крупнейший онлайн-ретейлер.", "website": "https://wildberries.ru"},
    {"name": "Avito", "industry": "IT, Классифайды", "description": "Платформа объявлений.", "website": "https://avito.ru"},
    {"name": "2ГИС", "industry": "IT, Картография", "description": "Справочник с картами городов.", "website": "https://2gis.ru"},
    {"name": "Kaspersky", "industry": "IT, Кибербезопасность", "description": "Международная компания по защите от киберугроз.", "website": "https://kaspersky.ru"},
    {"name": "МТС", "industry": "Телеком, IT", "description": "Телекоммуникационная компания.", "website": "https://mts.ru"},
]

# Список вакансий
VACANCIES = [
    {"title": "Frontend Developer (React)", "description": "Разработка интерфейсов на React. Требования: опыт от 1 года, знание TypeScript, Redux.", "type": "job", "work_format": "hybrid", "salary_from": 150000, "salary_to": 250000, "tags": ["React", "TypeScript", "Redux", "JavaScript", "HTML", "CSS"]},
    {"title": "Frontend Developer (Vue)", "description": "Разработка интерфейсов на Vue.js. Требования: опыт от 1 года, знание Vuex, Pinia.", "type": "job", "work_format": "remote", "salary_from": 140000, "salary_to": 240000, "tags": ["Vue.js", "JavaScript", "Vuex", "Pinia", "HTML", "CSS"]},
    {"title": "Backend Developer (Python)", "description": "Разработка бэкенда на Python/Django. Требования: опыт от 1 года, знание Django, PostgreSQL.", "type": "job", "work_format": "remote", "salary_from": 160000, "salary_to": 260000, "tags": ["Python", "Django", "PostgreSQL", "FastAPI", "REST API"]},
    {"title": "Backend Developer (Java)", "description": "Разработка на Java/Spring. Требования: опыт от 2 лет, знание Spring Boot, Hibernate.", "type": "job", "work_format": "office", "salary_from": 180000, "salary_to": 300000, "tags": ["Java", "Spring", "Hibernate", "Maven", "PostgreSQL"]},
    {"title": "Backend Developer (Go)", "description": "Разработка высоконагруженных систем на Go. Требования: опыт от 1 года, знание микросервисной архитектуры.", "type": "job", "work_format": "remote", "salary_from": 170000, "salary_to": 280000, "tags": ["Go", "Microservices", "Docker", "Kubernetes", "PostgreSQL"]},
    {"title": "Mobile Developer (React Native)", "description": "Разработка мобильных приложений на React Native. Требования: опыт от 1 года.", "type": "job", "work_format": "hybrid", "salary_from": 150000, "salary_to": 250000, "tags": ["React Native", "JavaScript", "TypeScript", "iOS", "Android"]},
    {"title": "Mobile Developer (Flutter)", "description": "Разработка кроссплатформенных приложений на Flutter.", "type": "job", "work_format": "remote", "salary_from": 140000, "salary_to": 240000, "tags": ["Flutter", "Dart", "iOS", "Android"]},
    {"title": "DevOps Engineer", "description": "Автоматизация развертывания и поддержка инфраструктуры. Требования: опыт от 1 года, знание Docker, Kubernetes, CI/CD.", "type": "job", "work_format": "remote", "salary_from": 180000, "salary_to": 300000, "tags": ["Docker", "Kubernetes", "Jenkins", "GitLab CI", "AWS"]},
    {"title": "Data Scientist", "description": "Анализ данных, построение ML моделей. Требования: опыт от 1 года, знание Python, Pandas, Scikit-learn.", "type": "job", "work_format": "remote", "salary_from": 170000, "salary_to": 280000, "tags": ["Python", "Pandas", "Scikit-learn", "SQL", "Machine Learning"]},
    {"title": "QA Engineer (Manual)", "description": "Ручное тестирование веб-приложений. Требования: опыт от 6 месяцев, понимание клиент-серверной архитектуры.", "type": "job", "work_format": "hybrid", "salary_from": 80000, "salary_to": 150000, "tags": ["Manual Testing", "Jira", "Postman", "SQL", "REST API"]},
    {"title": "QA Engineer (Automation)", "description": "Автоматизация тестирования. Требования: опыт от 1 года, знание Selenium, Python/Java.", "type": "job", "work_format": "remote", "salary_from": 120000, "salary_to": 200000, "tags": ["Selenium", "Python", "Pytest", "Jenkins", "REST API"]},
    {"title": "Стажировка Frontend", "description": "Стажировка для студентов. Обучение React, работа над реальными проектами.", "type": "internship", "work_format": "office", "salary_from": 40000, "salary_to": 60000, "tags": ["React", "JavaScript", "HTML", "CSS"]},
    {"title": "Стажировка Backend (Python)", "description": "Стажировка для студентов. Обучение Python/Django.", "type": "internship", "work_format": "remote", "salary_from": 40000, "salary_to": 60000, "tags": ["Python", "Django", "PostgreSQL", "REST API"]},
    {"title": "Стажировка Data Science", "description": "Стажировка для студентов. Обучение анализу данных и ML.", "type": "internship", "work_format": "remote", "salary_from": 40000, "salary_to": 60000, "tags": ["Python", "Pandas", "Machine Learning", "SQL"]},
    {"title": "Менторская программа: Python", "description": "Менторская программа для начинающих Python разработчиков. Индивидуальное наставничество.", "type": "mentorship", "work_format": "remote", "salary_from": 0, "salary_to": 0, "tags": ["Python", "Mentoring", "Career Development"]},
    {"title": "Менторская программа: React", "description": "Менторская программа для начинающих React разработчиков. Индивидуальное наставничество.", "type": "mentorship", "work_format": "remote", "salary_from": 0, "salary_to": 0, "tags": ["React", "Mentoring", "Career Development"]},
    {"title": "Менторская программа: DevOps", "description": "Менторская программа для начинающих DevOps инженеров.", "type": "mentorship", "work_format": "remote", "salary_from": 0, "salary_to": 0, "tags": ["DevOps", "Docker", "Kubernetes", "Mentoring"]},
    {"title": "Карьерный вебинар: Как пройти собеседование", "description": "Бесплатный вебинар по подготовке к техническим собеседованиям.", "type": "event", "work_format": "remote", "salary_from": 0, "salary_to": 0, "tags": ["Career", "Interview", "Webinar"]},
    {"title": "Карьерный вебинар: Как составить резюме", "description": "Бесплатный вебинар по составлению эффективного резюме.", "type": "event", "work_format": "remote", "salary_from": 0, "salary_to": 0, "tags": ["Career", "Resume", "Webinar"]},
    {"title": "Хакатон: AI Challenge", "description": "Соревнование по разработке AI решений. Призы для победителей.", "type": "event", "work_format": "office", "salary_from": 0, "salary_to": 0, "tags": ["Hackathon", "AI", "Machine Learning"]},
    {"title": "Хакатон: Web Development", "description": "Соревнование по веб-разработке.", "type": "event", "work_format": "hybrid", "salary_from": 0, "salary_to": 0, "tags": ["Hackathon", "Web Development", "React"]},
]

# Список городов с координатами
CITIES = [
    {"name": "Москва", "lat": 55.7558, "lon": 37.6173},
    {"name": "Санкт-Петербург", "lat": 59.9343, "lon": 30.3351},
    {"name": "Новосибирск", "lat": 55.0084, "lon": 82.9357},
    {"name": "Екатеринбург", "lat": 56.8389, "lon": 60.6057},
    {"name": "Казань", "lat": 55.7887, "lon": 49.1221},
    {"name": "Нижний Новгород", "lat": 56.2965, "lon": 43.9361},
    {"name": "Челябинск", "lat": 55.1644, "lon": 61.4368},
    {"name": "Самара", "lat": 53.1959, "lon": 50.1002},
    {"name": "Омск", "lat": 54.9885, "lon": 73.3242},
    {"name": "Ростов-на-Дону", "lat": 47.2221, "lon": 39.7203},
]

# Список соискателей
SEEKERS = [
    {"name": "Иван Петров", "university": "МГУ им. Ломоносова", "year": 2024, "skills": ["Python", "JavaScript", "React", "SQL"]},
    {"name": "Анна Смирнова", "university": "МФТИ", "year": 2025, "skills": ["Python", "Data Science", "Pandas", "Machine Learning"]},
    {"name": "Дмитрий Иванов", "university": "ВШЭ", "year": 2024, "skills": ["Java", "Spring", "PostgreSQL", "Docker"]},
    {"name": "Елена Козлова", "university": "ИТМО", "year": 2025, "skills": ["Go", "Kubernetes", "Docker", "CI/CD"]},
    {"name": "Максим Соколов", "university": "СПбГУ", "year": 2024, "skills": ["React", "TypeScript", "Next.js", "Tailwind"]},
    {"name": "Ольга Новикова", "university": "УрФУ", "year": 2025, "skills": ["Python", "Django", "Flask", "PostgreSQL"]},
    {"name": "Алексей Морозов", "university": "НГУ", "year": 2024, "skills": ["C++", "Rust", "Algorithms", "System Programming"]},
    {"name": "Мария Волкова", "university": "КФУ", "year": 2025, "skills": ["UI/UX", "Figma", "HTML", "CSS", "JavaScript"]},
    {"name": "Сергей Зайцев", "university": "СФУ", "year": 2024, "skills": ["PHP", "Laravel", "MySQL", "Vue.js"]},
    {"name": "Татьяна Кузнецова", "university": "ДВФУ", "year": 2025, "skills": ["Python", "QA", "Postman", "Selenium"]},
    {"name": "Андрей Павлов", "university": "Томский политех", "year": 2024, "skills": ["Java", "Kotlin", "Android", "Firebase"]},
    {"name": "Юлия Егорова", "university": "БГУ", "year": 2025, "skills": ["React Native", "JavaScript", "Redux", "Firebase"]},
    {"name": "Владимир Николаев", "university": "ЮФУ", "year": 2024, "skills": ["DevOps", "Docker", "Kubernetes", "Terraform", "AWS"]},
    {"name": "Наталья Федорова", "university": "МИРЭА", "year": 2025, "skills": ["Python", "Django", "PostgreSQL", "Redis"]},
    {"name": "Георгий Степанов", "university": "МГТУ им. Баумана", "year": 2024, "skills": ["C#", ".NET", "Azure", "SQL Server"]},
]

async def seed_full_data():
    engine = create_async_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    async with engine.connect() as conn:
        print("🚀 Начинаем заполнение базы данных...")
        print("-" * 50)
        
        # 1. Создаем работодателей
        print("📦 Создаем работодателей...")
        employer_ids = []
        for company in COMPANIES:
            hashed = get_password_hash("password123")
            result = await conn.execute(text("""
                INSERT INTO users (email, hashed_password, role, is_active)
                VALUES (:email, :password, 'employer', true)
                RETURNING id
            """), {
                "email": f"hr@{company['name'].lower().replace(' ', '')}.ru",
                "password": hashed
            })
            user_id = result.fetchone()[0]
            employer_ids.append(user_id)
            
            await conn.execute(text("""
                INSERT INTO employer_profiles (user_id, company_name, description, industry, website, is_verified)
                VALUES (:user_id, :company_name, :description, :industry, :website, true)
            """), {
                "user_id": user_id,
                "company_name": company['name'],
                "description": company['description'],
                "industry": company['industry'],
                "website": company['website']
            })
        print(f"   ✅ Создано {len(COMPANIES)} работодателей")
        
        # 2. Создаем соискателей (с JSON преобразованием)
        print("👤 Создаем соискателей...")
        seeker_ids = []
        for seeker in SEEKERS:
            hashed = get_password_hash("password123")
            result = await conn.execute(text("""
                INSERT INTO users (email, hashed_password, role, is_active)
                VALUES (:email, :password, 'seeker', true)
                RETURNING id
            """), {
                "email": f"{seeker['name'].lower().replace(' ', '.')}@example.com",
                "password": hashed
            })
            user_id = result.fetchone()[0]
            seeker_ids.append(user_id)
            
            # Преобразуем список навыков в JSON строку
            skills_json = json.dumps(seeker['skills'])
            
            await conn.execute(text("""
                INSERT INTO seeker_profiles (user_id, full_name, university, graduation_year, skills)
                VALUES (:user_id, :full_name, :university, :graduation_year, :skills)
            """), {
                "user_id": user_id,
                "full_name": seeker['name'],
                "university": seeker['university'],
                "graduation_year": seeker['year'],
                "skills": skills_json
            })
        print(f"   ✅ Создано {len(SEEKERS)} соискателей")
        
        # 3. Создаем куратора
        print("👨‍💼 Создаем куратора...")
        curator_hash = get_password_hash("password123")
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('curator@tramplin.ru', :password, 'curator', true)
            ON CONFLICT (email) DO NOTHING
        """), {"password": curator_hash})
        print("   ✅ Куратор создан")
        
        # 4. Создаем теги
        print("🏷️ Создаем теги...")
        all_tags = set()
        for vac in VACANCIES:
            for tag in vac['tags']:
                all_tags.add(tag)
        
        tag_ids = {}
        for tag in all_tags:
            result = await conn.execute(text("""
                INSERT INTO tags (name, category, is_system)
                VALUES (:name, 'skill', false)
                ON CONFLICT (name) DO NOTHING
                RETURNING id
            """), {"name": tag})
            row = result.fetchone()
            if row:
                tag_ids[tag] = row[0]
            else:
                result = await conn.execute(text("SELECT id FROM tags WHERE name = :name"), {"name": tag})
                tag_ids[tag] = result.fetchone()[0]
        print(f"   ✅ Создано {len(all_tags)} тегов")
        
        # 5. Создаем вакансии
        print("💼 Создаем вакансии...")
        opportunity_ids = []
        for i, vac in enumerate(VACANCIES):
            company_id = employer_ids[i % len(employer_ids)]
            city = CITIES[i % len(CITIES)]
            publication_date = datetime.now() - timedelta(days=random.randint(0, 30))
            expiry_date = publication_date + timedelta(days=random.randint(30, 90))
            
            result = await conn.execute(text("""
                INSERT INTO opportunities (
                    title, description, company_id, type, work_format,
                    location_city, lat, lon, salary_from, salary_to,
                    publication_date, expiry_date, is_active
                ) VALUES (
                    :title, :description, :company_id, :type, :work_format,
                    :location_city, :lat, :lon, :salary_from, :salary_to,
                    :publication_date, :expiry_date, true
                ) RETURNING id
            """), {
                "title": vac['title'],
                "description": vac['description'],
                "company_id": company_id,
                "type": vac['type'],
                "work_format": vac['work_format'],
                "location_city": city['name'],
                "lat": city['lat'],
                "lon": city['lon'],
                "salary_from": vac['salary_from'],
                "salary_to": vac['salary_to'],
                "publication_date": publication_date,
                "expiry_date": expiry_date
            })
            opp_id = result.fetchone()[0]
            opportunity_ids.append(opp_id)
            
            # Добавляем теги
            for tag in vac['tags']:
                if tag in tag_ids:
                    await conn.execute(text("""
                        INSERT INTO opportunity_tags (opportunity_id, tag_id)
                        VALUES (:opp_id, :tag_id)
                        ON CONFLICT DO NOTHING
                    """), {"opp_id": opp_id, "tag_id": tag_ids[tag]})
        print(f"   ✅ Создано {len(VACANCIES)} вакансий")
        
        # 6. Создаем отклики
        print("📝 Создаем отклики...")
        application_count = 0
        for opp_id in opportunity_ids:
            num_applications = random.randint(2, 8)
            shuffled_seekers = random.sample(seeker_ids, min(num_applications, len(seeker_ids)))
            
            for seeker_id in shuffled_seekers:
                status = random.choices(['pending', 'accepted', 'rejected', 'reserve'], weights=[0.5, 0.3, 0.1, 0.1])[0]
                applied_at = datetime.now() - timedelta(days=random.randint(0, 15))
                
                await conn.execute(text("""
                    INSERT INTO applications (seeker_id, opportunity_id, status, applied_at)
                    VALUES (:seeker_id, :opp_id, :status, :applied_at)
                    ON CONFLICT DO NOTHING
                """), {
                    "seeker_id": seeker_id,
                    "opp_id": opp_id,
                    "status": status,
                    "applied_at": applied_at
                })
                application_count += 1
        print(f"   ✅ Создано {application_count} откликов")
        
        # 7. Создаем избранное
        print("❤️ Создаем избранное...")
        favorites_count = 0
        for seeker_id in seeker_ids:
            num_favorites = random.randint(3, 8)
            favorite_opps = random.sample(opportunity_ids, min(num_favorites, len(opportunity_ids)))
            
            for opp_id in favorite_opps:
                await conn.execute(text("""
                    INSERT INTO favorites (user_id, opportunity_id)
                    VALUES (:user_id, :opp_id)
                    ON CONFLICT DO NOTHING
                """), {"user_id": seeker_id, "opp_id": opp_id})
                favorites_count += 1
        print(f"   ✅ Создано {favorites_count} избранных")
        
        # 8. Создаем контакты между соискателями
        print("👥 Создаем контакты...")
        connections_count = 0
        for i, seeker_id in enumerate(seeker_ids):
            num_connections = random.randint(2, 5)
            other_seekers = [s for s in seeker_ids if s != seeker_id]
            connection_seekers = random.sample(other_seekers, min(num_connections, len(other_seekers)))
            
            for other_id in connection_seekers:
                result = await conn.execute(text("""
                    SELECT id FROM connections 
                    WHERE (from_seeker_id = :from_id AND to_seeker_id = :to_id)
                    OR (from_seeker_id = :to_id AND to_seeker_id = :from_id)
                """), {"from_id": seeker_id, "to_id": other_id})
                if not result.fetchone():
                    status = random.choices(['pending', 'accepted'], weights=[0.3, 0.7])[0]
                    await conn.execute(text("""
                        INSERT INTO connections (from_seeker_id, to_seeker_id, status)
                        VALUES (:from_id, :to_id, :status)
                    """), {"from_id": seeker_id, "to_id": other_id, "status": status})
                    connections_count += 1
        print(f"   ✅ Создано {connections_count} контактов")
        
        print("-" * 50)
        print("🎉 База данных успешно заполнена!")
        print()
        print("📊 Итоговая статистика:")
        print(f"   🏢 Компаний: {len(COMPANIES)}")
        print(f"   👤 Соискателей: {len(SEEKERS)}")
        print(f"   💼 Вакансий: {len(VACANCIES)}")
        print(f"   📝 Откликов: {application_count}")
        print(f"   ❤️ Избранных: {favorites_count}")
        print(f"   👥 Контактов: {connections_count}")
        print()
        print("🔑 Тестовые учетные записи:")
        print("   📧 Работодатели:")
        for company in COMPANIES[:5]:
            print(f"      - {company['name']}: hr@{company['name'].lower().replace(' ', '')}.ru / password123")
        print(f"      ... и еще {len(COMPANIES) - 5} компаний")
        print("   📧 Соискатели (первые 5):")
        for seeker in SEEKERS[:5]:
            print(f"      - {seeker['name']}: {seeker['name'].lower().replace(' ', '.')}@example.com / password123")
        print(f"      ... и еще {len(SEEKERS) - 5} соискателей")
        print("   📧 Куратор: curator@tramplin.ru / password123")
        print()
        print("💡 Для демонстрации используйте любой из этих аккаунтов!")

if __name__ == "__main__":
    asyncio.run(seed_full_data())