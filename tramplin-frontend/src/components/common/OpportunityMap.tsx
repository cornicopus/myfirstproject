import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Исправление иконок Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Компонент для отслеживания границ карты
function MapBoundsUpdater({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  useMapEvents({
    moveend: () => {
      const map = (window as any)._leafletMap;
      if (map) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });
  return null;
}

interface OpportunityMapProps {
  onBoundsChange: (bounds: any) => void;
  favorites: number[];
  opportunities: any[];
}

const OpportunityMap: React.FC<OpportunityMapProps> = ({ 
  onBoundsChange, 
  favorites,
  opportunities 
}) => {
  const navigate = useNavigate();

  // Фильтруем вакансии с координатами
  const opportunitiesWithCoords = opportunities.filter(opp => {
    // Пропускаем онлайн-вакансии
    if (opp.location_city?.toLowerCase().includes('онлайн') || opp.work_format === 'remote') {
      return false;
    }
    return opp.lat || opp.lon || opp.latitude || opp.longitude;
  });

  // Получаем координаты для вакансии
  const getCoordinates = (opp: any): [number, number] | null => {
    // Проверяем разные варианты названий полей
    if (opp.lat && opp.lon) {
      return [opp.lat, opp.lon];
    }
    if (opp.latitude && opp.longitude) {
      return [opp.latitude, opp.longitude];
    }
    return null;
  };

  // Вычисляем центр карты
  const getMapCenter = (): [number, number] => {
    const coords = opportunitiesWithCoords
      .map(opp => getCoordinates(opp))
      .filter((c): c is [number, number] => c !== null);
    
    if (coords.length === 0) {
      return [55.7558, 37.6173]; // Москва по умолчанию
    }

    const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
    const avgLon = coords.reduce((sum, [, lon]) => sum + lon, 0) / coords.length;
    return [avgLat, avgLon];
  };

  // Цвет маркера в зависимости от избранного
  const getMarkerColor = (id: number) => favorites.includes(id) ? '#f44336' : '#1976d2';

  if (opportunities.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <Typography color="text.secondary">Нет вакансий для отображения на карте</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={getMapCenter()}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        whenCreated={(mapInstance) => {
          (window as any)._leafletMap = mapInstance;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapBoundsUpdater onBoundsChange={onBoundsChange} />
        
        {opportunitiesWithCoords.map((opp) => {
          const coords = getCoordinates(opp);
          if (!coords) return null;

          const isFavorite = favorites.includes(opp.id);
          const markerColor = getMarkerColor(opp.id);

          return (
            <Marker
              key={opp.id}
              position={coords}
            >
              <Popup>
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {opp.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {opp.company_name}
                  </Typography>
                  
                  <Chip 
                    label={opp.type === 'job' ? 'Вакансия' : opp.type === 'internship' ? 'Стажировка' : opp.type}
                    size="small"
                    color={opp.type === 'job' ? 'primary' : 'success'}
                    sx={{ mb: 1 }}
                  />
                  
                  {opp.salary_from && opp.salary_to && (
                    <Typography variant="body2" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                      {opp.salary_from.toLocaleString('ru-RU')} - {opp.salary_to.toLocaleString('ru-RU')} ₽
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {opp.location_city || 'Не указан'}
                    </Typography>
                  </Box>
                  
                  <Button 
                    size="small" 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 1 }}
                    onClick={() => navigate(`/opportunity/${opp.id}`)}
                  >
                    Подробнее
                  </Button>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default OpportunityMap;