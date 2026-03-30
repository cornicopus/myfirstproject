import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Stack,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOpportunities } from '../../store/slices/opportunitiesSlice';
import { fetchFavorites, toggleFavorite } from '../../store/slices/favoritesSlice';
import { usersService } from '../../services/usersService';
import { applicationsService } from '../../services/applicationsService';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import toast from 'react-hot-toast';

const SeekerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state: any) => state.auth);
  const { favorites } = useSelector((state: any) => state.favorites);
  const { opportunities } = useSelector((state: any) => state.opportunities);
  
  const [tabValue, setTabValue] = useState(0);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [profile, setProfile] = useState({
    full_name: '',
    university: '',
    graduation_year: '',
    about: '',
    skills: [] as string[],
  });
  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: 'all',
    contacts_visible: 'all',
    show_applications: true,
    show_favorites: true,
  });
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileData = await usersService.getSeekerProfile();
      setProfile({
        full_name: profileData.full_name || '',
        university: profileData.university || '',
        graduation_year: profileData.graduation_year?.toString() || '',
        about: profileData.about || '',
        skills: profileData.skills || [],
      });
      
      const apps = await usersService.getMyApplications();
      setApplications(apps);
      
      const conns = await usersService.getMyConnections();
      setConnections(conns);
      
      await dispatch(fetchOpportunities({ page: 1 }) as any);
      await dispatch(fetchFavorites() as any);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await usersService.updateSeekerProfile({
        full_name: profile.full_name,
        university: profile.university,
        graduation_year: parseInt(profile.graduation_year) || undefined,
        about: profile.about,
        skills: profile.skills,
      });
      toast.success('Профиль обновлен');
      setEditProfileOpen(false);
    } catch (error) {
      toast.error('Ошибка сохранения профиля');
    }
  };

  const handlePrivacySettings = () => {
    setPrivacySettingsOpen(true);
  };

  const handleSavePrivacySettings = async () => {
    try {
      await usersService.updateSeekerProfile({
        ...profile,
        privacy_settings: privacySettings,
      });
      toast.success('Настройки приватности сохранены');
      setPrivacySettingsOpen(false);
    } catch (error) {
      toast.error('Ошибка сохранения настроек');
    }
  };

  const handleApply = async (opportunityId: number) => {
    try {
      await applicationsService.createApplication(opportunityId);
      toast.success('Отклик отправлен!');
      loadData();
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Вы уже откликались на эту вакансию');
      } else {
        toast.error('Ошибка при отправке отклика');
      }
    }
  };

  const handleToggleFavorite = async (opportunityId: number) => {
    await dispatch(toggleFavorite(opportunityId) as any);
  };

  const handleRemoveFavorite = async (opportunityId: number) => {
    await dispatch(toggleFavorite(opportunityId) as any);
    toast.success('Удалено из избранного');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'На рассмотрении';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      case 'reserve': return 'В резерве';
      default: return status;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'reserve': return 'info';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      job: 'Вакансия',
      internship: 'Стажировка',
      mentorship: 'Менторство',
      event: 'Мероприятие',
    };
    return types[type] || type;
  };

  const getWorkFormatLabel = (format: string) => {
    const formats: Record<string, string> = {
      office: 'В офисе',
      hybrid: 'Гибрид',
      remote: 'Удаленно',
    };
    return formats[format] || format;
  };

  const recommendedOpportunities = opportunities
    .filter((opp: any) => opp.is_active !== false)
    .slice(0, 10);
  const favoriteOpportunities = opportunities.filter((opp: any) => favorites.includes(opp.id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Левая колонка - профиль и меню */}
        <Grid item xs={12} md={3.5}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, border: '1px solid #E8EDF2' }}>
            <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#0F2B3D' }}>
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={600} sx={{ color: '#0F2B3D' }}>
              {profile.full_name || user?.email}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5A6E7C', mb: 1 }}>
              {profile.university}, {profile.graduation_year}
            </Typography>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 1, borderRadius: 2, borderColor: '#E8EDF2', color: '#0F2B3D' }}
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
            >
              Редактировать профиль
            </Button>
          </Paper>

          {/* Меню навигации */}
          <Paper sx={{ mt: 2, borderRadius: 3, border: '1px solid #E8EDF2', overflow: 'hidden' }}>
            <List component="nav" sx={{ p: 0 }}>
              <ListItem 
                button 
                selected={tabValue === 0}
                onClick={() => setTabValue(0)}
                sx={{ 
                  py: 1.5,
                  '&.Mui-selected': { bgcolor: '#E6B17E20', borderLeft: `3px solid #E6B17E` },
                  '&:hover': { bgcolor: '#F5F5F5' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <WorkIcon sx={{ color: tabValue === 0 ? '#E6B17E' : '#9AAEB9' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Рекомендации" 
                  primaryTypographyProps={{ fontWeight: tabValue === 0 ? 600 : 400 }}
                />
              </ListItem>
              <ListItem 
                button 
                selected={tabValue === 1}
                onClick={() => setTabValue(1)}
                sx={{ 
                  py: 1.5,
                  '&.Mui-selected': { bgcolor: '#E6B17E20', borderLeft: `3px solid #E6B17E` },
                  '&:hover': { bgcolor: '#F5F5F5' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FavoriteIcon sx={{ color: tabValue === 1 ? '#E6B17E' : '#9AAEB9' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Избранное" 
                  secondary={favoriteOpportunities.length > 0 ? `${favoriteOpportunities.length}` : undefined}
                  primaryTypographyProps={{ fontWeight: tabValue === 1 ? 600 : 400 }}
                />
              </ListItem>
              <ListItem 
                button 
                selected={tabValue === 2}
                onClick={() => setTabValue(2)}
                sx={{ 
                  py: 1.5,
                  '&.Mui-selected': { bgcolor: '#E6B17E20', borderLeft: `3px solid #E6B17E` },
                  '&:hover': { bgcolor: '#F5F5F5' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <HistoryIcon sx={{ color: tabValue === 2 ? '#E6B17E' : '#9AAEB9' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Отклики" 
                  secondary={applications.filter(a => a.status === 'pending').length > 0 ? `${applications.filter(a => a.status === 'pending').length} активных` : undefined}
                  primaryTypographyProps={{ fontWeight: tabValue === 2 ? 600 : 400 }}
                />
              </ListItem>
              <ListItem 
                button 
                selected={tabValue === 3}
                onClick={() => setTabValue(3)}
                sx={{ 
                  py: 1.5,
                  '&.Mui-selected': { bgcolor: '#E6B17E20', borderLeft: `3px solid #E6B17E` },
                  '&:hover': { bgcolor: '#F5F5F5' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PeopleIcon sx={{ color: tabValue === 3 ? '#E6B17E' : '#9AAEB9' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Контакты" 
                  secondary={connections.length > 0 ? `${connections.length}` : undefined}
                  primaryTypographyProps={{ fontWeight: tabValue === 3 ? 600 : 400 }}
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem 
                button 
                onClick={handlePrivacySettings}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SettingsIcon sx={{ color: '#9AAEB9' }} />
                </ListItemIcon>
                <ListItemText primary="Настройки приватности" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Правая колонка - контент */}
        <Grid item xs={12} md={8.5}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #E8EDF2', minHeight: '70vh' }}>
            {/* Рекомендации */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 3 }}>
                  Рекомендуемые вакансии
                </Typography>
                {recommendedOpportunities.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 6, color: '#5A6E7C' }}>
                    Пока нет рекомендуемых вакансий
                  </Typography>
                ) : (
                  <Stack spacing={2.5}>
                    {recommendedOpportunities.map((opp: any) => (
                      <Card 
                        key={opp.id} 
                        sx={{ 
                          borderRadius: 2, 
                          border: '1px solid #E8EDF2', 
                          boxShadow: 'none',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: '#E6B17E', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                  {opp.title}
                                </Typography>
                                <Chip 
                                  label={getTypeLabel(opp.type)} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderRadius: 1 }}
                                />
                                {!opp.is_active && (
                                  <Chip label="Закрыта" size="small" color="error" />
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ color: '#5A6E7C', mb: 1 }}>
                                {opp.company_name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOnIcon fontSize="small" sx={{ color: '#9AAEB9' }} />
                                  <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                                    {opp.location_city || 'Не указан'}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={getWorkFormatLabel(opp.work_format)} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ borderRadius: 1 }}
                                />
                                {opp.salary_from && opp.salary_to && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AttachMoneyIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                                    <Typography variant="body2" color="success.main" fontWeight={500}>
                                      {opp.salary_from.toLocaleString()} - {opp.salary_to.toLocaleString()} ₽
                                    </Typography>
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarTodayIcon fontSize="small" sx={{ color: '#9AAEB9' }} />
                                  <Typography variant="caption" sx={{ color: '#9AAEB9' }}>
                                    {new Date(opp.publication_date).toLocaleDateString('ru-RU')}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#5A6E7C', 
                                  mb: 1.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {opp.description.length > 120 ? opp.description.substring(0, 120) + '...' : opp.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {opp.tags?.slice(0, 4).map((tag: string) => (
                                  <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                ))}
                                {opp.tags?.length > 4 && (
                                  <Chip label={`+${opp.tags.length - 4}`} size="small" variant="outlined" />
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', minWidth: 100 }}>
                              <IconButton 
                                onClick={() => handleToggleFavorite(opp.id)}
                                color={favorites.includes(opp.id) ? 'error' : 'default'}
                                size="small"
                              >
                                {favorites.includes(opp.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                              </IconButton>
                              <Button 
                                size="small" 
                                variant="contained" 
                                onClick={() => handleApply(opp.id)}
                                sx={{ 
                                  bgcolor: '#0F2B3D', 
                                  '&:hover': { bgcolor: '#1E3A4D' },
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  px: 2.5
                                }}
                              >
                                Откликнуться
                              </Button>
                              <Button 
                                size="small" 
                                variant="text" 
                                onClick={() => navigate(`/opportunity/${opp.id}`)}
                                sx={{ textTransform: 'none', color: '#E6B17E' }}
                              >
                                Подробнее →
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Избранное */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 3 }}>
                  Избранные вакансии
                </Typography>
                {favoriteOpportunities.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 6, color: '#5A6E7C' }}>
                    У вас пока нет избранных вакансий
                  </Typography>
                ) : (
                  <Stack spacing={2.5}>
                    {favoriteOpportunities.map((opp: any) => (
                      <Card key={opp.id} sx={{ borderRadius: 2, border: '1px solid #E8EDF2', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {opp.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5A6E7C', mb: 1 }}>
                                {opp.company_name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOnIcon fontSize="small" sx={{ color: '#9AAEB9' }} />
                                  <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                                    {opp.location_city || 'Не указан'}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={getWorkFormatLabel(opp.work_format)} 
                                  size="small" 
                                  variant="outlined" 
                                />
                                {opp.salary_from && opp.salary_to && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AttachMoneyIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                                    <Typography variant="body2" color="success.main" fontWeight={500}>
                                      {opp.salary_from.toLocaleString()} - {opp.salary_to.toLocaleString()} ₽
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {opp.tags?.slice(0, 5).map((tag: string) => (
                                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', minWidth: 100 }}>
                              <IconButton onClick={() => handleRemoveFavorite(opp.id)} color="error" size="small">
                                <FavoriteIcon />
                              </IconButton>
                              <Button 
                                size="small" 
                                variant="contained" 
                                onClick={() => handleApply(opp.id)}
                                sx={{ bgcolor: '#0F2B3D', '&:hover': { bgcolor: '#1E3A4D' }, borderRadius: 2 }}
                              >
                                Откликнуться
                              </Button>
                              <Button 
                                size="small" 
                                variant="text" 
                                onClick={() => navigate(`/opportunity/${opp.id}`)}
                                sx={{ color: '#E6B17E' }}
                              >
                                Подробнее →
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Отклики */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 3 }}>
                  История откликов
                </Typography>
                {applications.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 6, color: '#5A6E7C' }}>
                    У вас пока нет откликов
                  </Typography>
                ) : (
                  <Stack spacing={2.5}>
                    {applications.map((app) => (
                      <Card key={app.id} sx={{ borderRadius: 2, border: '1px solid #E8EDF2', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600}>{app.opportunity_title}</Typography>
                              <Typography variant="body2" sx={{ color: '#5A6E7C', mb: 0.5 }}>
                                {app.company_name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                                {app.salary_from && app.salary_to && (
                                  <Typography variant="body2" color="success.main" fontWeight={500}>
                                    {app.salary_from.toLocaleString()} - {app.salary_to.toLocaleString()} ₽
                                  </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: '#9AAEB9' }}>
                                  Отклик отправлен: {new Date(app.applied_at).toLocaleDateString('ru-RU')}
                                </Typography>
                              </Box>
                              {app.cover_letter && (
                                <Typography variant="body2" sx={{ color: '#5A6E7C', mt: 1, p: 1.5, bgcolor: '#F8F9FC', borderRadius: 2 }}>
                                  <strong>Сопроводительное письмо:</strong> {app.cover_letter}
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label={getStatusText(app.status)} 
                              color={getStatusColor(app.status)}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Контакты */}
            {tabValue === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 3 }}>
                  Мои контакты
                </Typography>
                {connections.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 6, color: '#5A6E7C' }}>
                    У вас пока нет контактов
                  </Typography>
                ) : (
                  <Grid container spacing={2.5}>
                    {connections.map((conn) => (
                      <Grid item xs={12} sm={6} md={4} key={conn.id}>
                        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E8EDF2', height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#E6B17E', width: 48, height: 48 }}>
                              {conn.from_seeker_name?.[0] || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>{conn.from_seeker_name || 'Пользователь'}</Typography>
                              <Typography variant="caption" sx={{ color: '#5A6E7C' }}>
                                {conn.status === 'accepted' ? '✓ Друг' : '⏳ Запрос отправлен'}
                              </Typography>
                            </Box>
                          </Box>
                          {conn.skills && conn.skills.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                              {conn.skills.slice(0, 3).map((skill: string) => (
                                <Chip key={skill} label={skill} size="small" variant="outlined" />
                              ))}
                            </Box>
                          )}
                          <Button 
                            size="small" 
                            variant="outlined" 
                            fullWidth 
                            sx={{ mt: 2, borderRadius: 2 }}
                            onClick={() => toast.info('Функция в разработке')}
                          >
                            Написать сообщение
                          </Button>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Диалог редактирования профиля */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Редактирование профиля
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditProfileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ФИО"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="ВУЗ"
            value={profile.university}
            onChange={(e) => setProfile({ ...profile, university: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Год выпуска"
            value={profile.graduation_year}
            onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="О себе"
            multiline
            rows={3}
            value={profile.about}
            onChange={(e) => setProfile({ ...profile, about: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Навыки (через запятую)"
            value={profile.skills.join(', ')}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveProfile}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог настроек приватности */}
      <Dialog open={privacySettingsOpen} onClose={() => setPrivacySettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Настройки приватности
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setPrivacySettingsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormGroup>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#0F2B3D', fontWeight: 500 }}>
              Кто может видеть ваш профиль
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.profile_visible === 'all'}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, profile_visible: e.target.checked ? 'all' : 'none' })}
                />
              }
              label="Виден всем"
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#0F2B3D', fontWeight: 500 }}>
              Кто может видеть ваши контакты
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.contacts_visible === 'all'}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, contacts_visible: e.target.checked ? 'all' : 'none' })}
                />
              }
              label="Контакты видны всем"
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#0F2B3D', fontWeight: 500 }}>
              Отображение откликов
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.show_applications}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, show_applications: e.target.checked })}
                />
              }
              label="Показывать мои отклики"
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#0F2B3D', fontWeight: 500 }}>
              Отображение избранного
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.show_favorites}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, show_favorites: e.target.checked })}
                />
              }
              label="Показывать мои избранные вакансии"
            />
          </FormGroup>
          <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
            Настройки приватности определяют, какая информация будет доступна другим пользователям платформы.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacySettingsOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePrivacySettings}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SeekerDashboard;