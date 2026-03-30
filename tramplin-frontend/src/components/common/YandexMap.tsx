import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const YANDEX_API_KEY = '36b9f3de-e926-41b7-8b05-1893ebb8436a';

interface YandexMapProps {
  onBoundsChange: (bounds: any) => void;
  favorites: number[];
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap: React.FC<YandexMapProps> = ({ onBoundsChange, favorites }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { opportunities } = useSelector((state: any) => state.opportunities);
  const markersRef = useRef<any[]>([]);

  // Загрузка Яндекс.Карт API
  useEffect(() => {
    if (window.ymaps) {
      window.ymaps.ready(initMap);
      return;
    }

    const loadYandexMaps = () => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(initMap);
        }
      };
      script.onerror = () => {
        setError('Ошибка загрузки карты. Проверьте API ключ и интернет соединение.');
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    loadYandexMaps();
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    try {
      const newMap = new window.ymaps.Map(mapRef.current, {
        center: [55.7558, 37.6173],
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      setMap(newMap);
      setLoading(false);

      newMap.events.add('boundschange', () => {
        const bounds = newMap.getBounds();
        onBoundsChange({
          north: bounds[0][0],
          south: bounds[1][0],
          east: bounds[1][1],
          west: bounds[0][1],
        });
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Ошибка инициализации карты');
      setLoading(false);
    }
  };

  // Добавление маркеров
  useEffect(() => {
    if (!map || !window.ymaps) return;

    const updateMarkers = () => {
      markersRef.current.forEach(marker => {
        map.geoObjects.remove(marker);
      });
      markersRef.current = [];

      const validOpportunities = opportunities.filter(opp => opp.lat && opp.lon);
      
      if (validOpportunities.length === 0) return;

      validOpportunities.forEach((opp) => {
        const isFavorite = favorites.includes(opp.id);
        
        const markerContent = `
          <div style="
            background-color: ${isFavorite ? '#f44336' : '#1976d2'};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
            transition: transform 0.2s;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `;
        
        const placemark = new window.ymaps.Placemark(
          [opp.lat, opp.lon],
          {
            balloonContentHeader: `<b>${opp.title}</b>`,
            balloonContentBody: `
              <div>
                <p style="margin: 4px 0; color: #666;">${opp.company_name}</p>
                ${opp.salary_from && opp.salary_to ? `<p style="margin: 8px 0; font-weight: bold; color: #2e7d32;">${opp.salary_from.toLocaleString()} - ${opp.salary_to.toLocaleString()} ₽</p>` : ''}
                <p style="margin: 4px 0; color: #666;">📍 ${opp.location_city || 'Не указан'}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                  ${opp.tags?.slice(0, 5).map((tag: string) => `
                    <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 16px; font-size: 11px;">${tag}</span>
                  `).join('')}
                </div>
              </div>
            `,
            balloonContentFooter: `<a href="/opportunity/${opp.id}" style="color: #1976d2; text-decoration: none;">Подробнее →</a>`,
          },
          {
            iconLayout: 'default#imageWithContent',
            iconContentLayout: window.ymaps.templateLayoutFactory.createClass(markerContent),
            iconContentOffset: [-16, -16],
            hideIconOnBalloonOpen: false,
            balloonOffset: [0, -20],
          }
        );
        
        placemark.events.add('click', () => {
          navigate(`/opportunity/${opp.id}`);
        });
        
        map.geoObjects.add(placemark);
        markersRef.current.push(placemark);
      });
    };

    updateMarkers();
  }, [map, opportunities, favorites, navigate]);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка карты...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', flexDirection: 'column', p: 2 }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Попробуйте обновить страницу или проверьте API ключ
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={mapRef}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    />
  );
};

export default YandexMap;