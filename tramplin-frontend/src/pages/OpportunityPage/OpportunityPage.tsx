import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOpportunityById } from '../../store/slices/opportunitiesSlice';
import { toggleFavorite, fetchFavorites } from '../../store/slices/favoritesSlice';
import { applicationsService } from '../../services/applicationsService';
import { usersService } from '../../services/usersService';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoneIcon from '@mui/icons-material/Done';
import toast from 'react-hot-toast';

const OpportunityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedOpportunity, isLoading } = useSelector((state: any) => state.opportunities);
  const { favorites } = useSelector((state: any) => state.favorites);
  const { user } = useSelector((state: any) => state.auth);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchOpportunityById(parseInt(id)) as any);
      dispatch(fetchFavorites() as any);
    }
  }, [dispatch, id]);

  useEffect(() => {
    checkIfApplied();
  }, [id, user]);

  const checkIfApplied = async () => {
    setCheckingApplication(true);
    if (!user || user.role !== 'seeker') {
      setCheckingApplication(false);
      return;
    }
    
    try {
      const applications = await usersService.getMyApplications();
      const applied = applications.some((app: any) => app.opportunity_id === parseInt(id!));
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Войдите в систему чтобы добавить в избранное');
      navigate('/login');
      return;
    }
    if (selectedOpportunity) {
      await dispatch(toggleFavorite(selectedOpportunity.id) as any);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Войдите в систему чтобы откликнуться');
      navigate('/login');
      return;
    }
    if (user.role !== 'seeker') {
      toast.error('Только соискатели могут откликаться');
      return;
    }
    if (hasApplied) {
      toast.error('Вы уже откликались на эту вакансию');
      return;
    }
    
    setApplying(true);
    try {
      await applicationsService.createApplication(selectedOpportunity.id);
      toast.success('Отклик отправлен! Работодатель свяжется с вами');
      setHasApplied(true);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Вы уже откликались на эту вакансию');
        setHasApplied(true);
      } else {
        toast.error('Ошибка при отправке отклика');
      }
    } finally {
      setApplying(false);
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      job: 'primary',
      internship: 'success',
      mentorship: 'warning',
      event: 'info',
    };
    return colors[type] || 'default';
  };

  const getWorkFormatLabel = (format: string) => {
    const formats: Record<string, string> = {
      office: 'В офисе',
      hybrid: 'Гибрид',
      remote: 'Удаленно',
    };
    return formats[format] || format;
  };

  if (isLoading || !selectedOpportunity) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isFavorite = favorites.includes(selectedOpportunity.id);
  const opportunity = selectedOpportunity;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Основная информация */}
        <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EDF2', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Заголовок */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight={700} sx={{ color: '#0F2B3D', mb: 2 }}>
                {opportunity.title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={getTypeLabel(opportunity.type)} 
                  color={getTypeColor(opportunity.type)}
                  size="medium"
                />
                <Chip 
                  label={getWorkFormatLabel(opportunity.work_format)} 
                  variant="outlined"
                  size="medium"
                />
                {!opportunity.is_active && (
                  <Chip label="Закрыта" color="error" size="medium" />
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: '#5A6E7C' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="body2">{opportunity.company_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{opportunity.location_city || 'Не указан'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  <Typography variant="body2">
                    Опубликовано: {new Date(opportunity.publication_date).toLocaleDateString('ru-RU')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Описание */}
            <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 2 }}>
              О вакансии
            </Typography>
            <Typography variant="body1" sx={{ color: '#5A6E7C', lineHeight: 1.6, mb: 3, whiteSpace: 'pre-wrap' }}>
              {opportunity.description}
            </Typography>

            {/* Требования / Навыки */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 2 }}>
                  Ключевые навыки
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {opportunity.tags.map((tag: string) => (
                    <Chip key={tag} label={tag} variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {/* Контакты */}
            {(opportunity.contact_email || opportunity.contact_phone) && (
              <>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 2 }}>
                  Контактная информация
                </Typography>
                <List sx={{ bgcolor: '#F8F9FC', borderRadius: 2, p: 0 }}>
                  {opportunity.contact_email && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon sx={{ color: '#E6B17E' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email для связи"
                        secondary={opportunity.contact_email}
                        secondaryTypographyProps={{ sx: { color: '#0F2B3D', fontWeight: 500 } }}
                      />
                    </ListItem>
                  )}
                  {opportunity.contact_phone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon sx={{ color: '#E6B17E' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Телефон"
                        secondary={opportunity.contact_phone}
                        secondaryTypographyProps={{ sx: { color: '#0F2B3D', fontWeight: 500 } }}
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}
          </Paper>
        </Grid>

        {/* Боковая панель */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Кнопки действий */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EDF2' }}>
              <Stack spacing={2}>
                {user?.role === 'seeker' && !checkingApplication && (
                  hasApplied ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled
                      startIcon={<DoneIcon />}
                      sx={{
                        bgcolor: '#2E7D32',
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&.Mui-disabled': { bgcolor: '#2E7D32', color: 'white', opacity: 0.8 }
                      }}
                    >
                      Вы уже откликнулись
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleApply}
                      disabled={applying || !opportunity.is_active}
                      sx={{
                        bgcolor: '#0F2B3D',
                        '&:hover': { bgcolor: '#1E3A4D' },
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                      }}
                    >
                      {applying ? <CircularProgress size={24} color="inherit" /> : 'Откликнуться'}
                    </Button>
                  )
                )}
                
                {user?.role !== 'seeker' && user?.role === 'employer' && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Вы вошли как работодатель. Для отклика на вакансию войдите как соискатель.
                  </Alert>
                )}
                
                {!user && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Войдите в систему чтобы откликнуться на вакансию.
                  </Alert>
                )}
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleToggleFavorite}
                  startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  sx={{
                    borderColor: '#E8EDF2',
                    color: isFavorite ? '#f44336' : '#0F2B3D',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#E6B17E' },
                  }}
                >
                  {isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                </Button>
              </Stack>
            </Paper>

            {/* Информация о компании */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EDF2' }}>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 2 }}>
                О компании
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: '#0F2B3D' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {opportunity.company_name}
                  </Typography>
                  {opportunity.company_is_verified && (
                    <Chip label="Верифицировано" size="small" color="success" variant="outlined" />
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#5A6E7C', mb: 2 }}>
                {opportunity.company_description || 'Информация о компании не указана'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0F2B3D', mb: 1 }}>
                Детали вакансии
              </Typography>
              <List sx={{ p: 0 }}>
                {opportunity.salary_from && opportunity.salary_to && (
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AttachMoneyIcon sx={{ color: '#2E7D32' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Зарплата"
                      secondary={`${opportunity.salary_from.toLocaleString()} - ${opportunity.salary_to.toLocaleString()} ₽`}
                      secondaryTypographyProps={{ sx: { fontWeight: 500, color: '#2E7D32' } }}
                    />
                  </ListItem>
                )}
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <WorkIcon sx={{ color: '#9AAEB9' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Тип занятости"
                    secondary={getTypeLabel(opportunity.type)}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon sx={{ color: '#9AAEB9' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Формат работы"
                    secondary={getWorkFormatLabel(opportunity.work_format)}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AccessTimeIcon sx={{ color: '#9AAEB9' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Срок действия"
                    secondary={opportunity.expiry_date 
                      ? new Date(opportunity.expiry_date).toLocaleDateString('ru-RU')
                      : 'Не ограничен'}
                  />
                </ListItem>
              </List>

              {opportunity.is_active === false && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  Эта вакансия закрыта и больше не принимает отклики.
                </Alert>
              )}
            </Paper>

            {/* Кнопка "Все вакансии компании" */}
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/')}
              sx={{ color: '#E6B17E', textTransform: 'none', py: 1 }}
            >
              ← Вернуться к списку вакансий
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OpportunityPage;