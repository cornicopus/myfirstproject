import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography, Paper, Chip, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Fix для маркеров в react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapProps {
  onBoundsChange: (bounds: any) => void;
  favorites: number[];
}

// Компонент для отслеживания границ карты
const MapBoundsUpdater = ({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });
  return null;
};

// Компонент для обновления центра карты без пересоздания
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
};

// Создание кастомной иконки маркера
const createCustomIcon = (isFavorite: boolean) => {
  const color = isFavorite ? '#f44336' : '#1976d2';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const SimpleMap: React.FC<SimpleMapProps> = ({ onBoundsChange, favorites }) => {
  const navigate = useNavigate();
  const { opportunities, isLoading } = useSelector((state: any) => state.opportunities);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]);
  const [mapZoom, setMapZoom] = useState(10);
  const [initialized, setInitialized] = useState(false);

  // Вычисляем центр карты по вакансиям только при первой загрузке
  useEffect(() => {
    if (!initialized && opportunities.length > 0) {
      const validOpps = opportunities.filter((opp: any) => opp.lat && opp.lon);
      if (validOpps.length > 0) {
        const avgLat = validOpps.reduce((sum: number, opp: any) => sum + opp.lat, 0) / validOpps.length;
        const avgLon = validOpps.reduce((sum: number, opp: any) => sum + opp.lon, 0) / validOpps.length;
        setMapCenter([avgLat, avgLon]);
        setInitialized(true);
      }
    }
  }, [opportunities, initialized]);

  // Фильтруем вакансии с координатами
  const validOpportunities = opportunities.filter((opp: any) => opp.lat && opp.lon);

  if (isLoading && validOpportunities.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка карты...</Typography>
      </Box>
    );
  }

  if (validOpportunities.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', flexDirection: 'column' }}>
        <LocationOnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">Нет вакансий для отображения на карте</Typography>
        <Typography variant="caption" color="text.secondary">
          Добавьте координаты для вакансий или дождитесь их появления
        </Typography>
      </Box>
    );
  }

  return (
    <MapContainer
      key="main-map"
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      attributionControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapBoundsUpdater onBoundsChange={onBoundsChange} />
      
      {validOpportunities.map((opp: any) => {
        const isFavorite = favorites.includes(opp.id);
        const markerIcon = createCustomIcon(isFavorite);
        
        return (
          <Marker
            key={opp.id}
            position={[opp.lat, opp.lon]}
            icon={markerIcon}
          >
            <Popup>
              <Paper sx={{ p: 1.5, minWidth: 220, maxWidth: 280 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {opp.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {opp.company_name}
                </Typography>
                
                {opp.salary_from && opp.salary_to && (
                  <Typography variant="body2" color="primary.main" fontWeight="bold" sx={{ mt: 1 }}>
                    {opp.salary_from.toLocaleString()} - {opp.salary_to.toLocaleString()} ₽
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {opp.location_city || 'Не указан'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {opp.tags?.slice(0, 4).map((tag: string) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
                
                <Button 
                  size="small" 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/opportunity/${opp.id}`)}
                >
                  Подробнее
                </Button>
              </Paper>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default SimpleMap;