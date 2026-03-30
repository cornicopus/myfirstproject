import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Pagination,
  Stack,
  Container,
  Paper,
  Fade,
  Grow,
  Slide,
  Avatar,
  Divider,
  alpha,
  Badge,
  Tooltip,
  Zoom,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOpportunities, setFilters, setCurrentPage } from '../../store/slices/opportunitiesSlice';
import { toggleFavorite, fetchFavorites } from '../../store/slices/favoritesSlice';
import FilterSidebar from '../../components/forms/FilterSidebar';
import SimpleMap from '../../components/common/SimpleMap';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedIcon from '@mui/icons-material/Verified';
import toast from 'react-hot-toast';
import { applicationsService } from '../../services/applicationsService';
import { fetchTotalCount } from '../../store/slices/opportunitiesSlice';

// Анимация для появления карточек
const AnimatedCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  return (
    <Grow in timeout={300 + index * 50}>
      <Box>{children}</Box>
    </Grow>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const [boundsTimeout, setBoundsTimeout] = useState<NodeJS.Timeout | null>(null);

  const { totalCountAll } = useSelector((state: any) => state.opportunities);

  const { opportunities, filters, isLoading, totalCount, currentPage } = useSelector(
    (state: any) => state.opportunities
  );
  const { favorites } = useSelector((state: any) => state.favorites);
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    dispatch(fetchOpportunities({ bounds: mapBounds, filters, page: currentPage }) as any);
  }, [dispatch, filters, currentPage]);

  useEffect(() => {
    dispatch(fetchFavorites() as any);
  }, [dispatch]);

  useEffect(() => {
  dispatch(fetchTotalCount(filters) as any);
  }, [dispatch, filters]);

  const handleBoundsChange = useCallback((bounds: any) => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    const timeout = setTimeout(() => {
      setMapBounds(bounds);
      dispatch(fetchOpportunities({ bounds, filters, page: 1 }) as any);
      dispatch(setCurrentPage(1));
    }, 500);
    setBoundsTimeout(timeout);
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters: any) => {
    dispatch(setFilters(newFilters) as any);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page) as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    await dispatch(toggleFavorite(id) as any);
  };

  const handleApply = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      toast.error('Войдите в систему чтобы откликнуться');
      navigate('/login');
      return;
    }
    if (user.role !== 'seeker') {
      toast.error('Только соискатели могут откликаться');
      return;
    }
    
    setApplying(id);
    try {
      await applicationsService.createApplication(id);
      toast.success('Отклик отправлен! Работодатель свяжется с вами');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Вы уже откликались на эту вакансию');
      } else {
        toast.error('Ошибка при отправке отклика');
      }
    } finally {
      setApplying(null);
    }
  };

  const handleSearch = () => {
    dispatch(setFilters({ search: searchQuery }) as any);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      job: { label: 'Вакансия', icon: <WorkIcon sx={{ fontSize: 14 }} />, color: '#1976d2' },
      internship: { label: 'Стажировка', icon: <TrendingUpIcon sx={{ fontSize: 14 }} />, color: '#2e7d32' },
      mentorship: { label: 'Менторство', icon: <PeopleIcon sx={{ fontSize: 14 }} />, color: '#ed6c02' },
      event: { label: 'Мероприятие', icon: <CalendarTodayIcon sx={{ fontSize: 14 }} />, color: '#9c27b0' },
    };
    return types[type] || { label: type, icon: null, color: '#666' };
  };

  const getWorkFormatLabel = (format: string) => {
    const formats: Record<string, string> = {
      office: 'В офисе',
      hybrid: 'Гибрид',
      remote: 'Удаленно',
    };
    return formats[format] || format;
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
      {/* Hero секция */}
      <Box
        sx={{
          bgcolor: '#0F2B3D',
          color: 'white',
          pt: { xs: 4, md: 6 },
          pb: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(230, 177, 126, 0.1) 0%, transparent 50%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(44, 95, 122, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
                Найди свою идеальную работу
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, mb: 4, color: '#E6B17E' }}>
                Более {totalCountAll.toLocaleString()} вакансий от ведущих IT-компаний
              </Typography>
            </Box>
          </Fade>

          <Slide direction="up" in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                maxWidth: 800,
                mx: 'auto',
                p: 1,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <TextField
                fullWidth
                placeholder="Поиск вакансий, стажировок, мероприятий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#E6B17E' }} />
                    </InputAdornment>
                  ),
                  sx: { py: 1.5, px: 2, color: 'white' },
                }}
                sx={{
                  '& input': { color: 'white' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.6)' },
                }}
              />
            </Paper>
          </Slide>
        </Container>
      </Box>

      {/* Основной контент */}
      <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flex: 1 }}>
        <Grid container spacing={3}>
          {/* Фильтры - десктоп */}
          {!isMobile && (
            <Grid size={{ md: 3, lg: 2.5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'white',
                  position: 'sticky',
                  top: 80,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Фильтры
                </Typography>
                <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
              </Paper>
            </Grid>
          )}

          {/* Карта и список вакансий */}
          <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
            <Stack spacing={3}>
              {/* Карта */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  height: 400,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <SimpleMap onBoundsChange={handleBoundsChange} favorites={favorites} />
                {isMobile && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: 'white',
                      boxShadow: 2,
                      zIndex: 10,
                    }}
                    onClick={() => setMobileFilterOpen(true)}
                  >
                    <FilterListIcon />
                  </IconButton>
                )}
              </Paper>

              {/* Заголовок и статистика */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {isLoading && opportunities.length === 0 ? 'Загрузка...' : `Найдено ${totalCount} вакансий`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {opportunities.length} вакансий отображается сейчас
                  </Typography>
                </Box>
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                  />
                )}
              </Box>

              {/* Список вакансий */}
              {isLoading && opportunities.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : opportunities.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    По вашему запросу ничего не найдено
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Попробуйте изменить параметры поиска или сбросить фильтры
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {opportunities.map((opp: any, index: number) => {
                    const typeInfo = getTypeLabel(opp.type);
                    const isFavorite = favorites.includes(opp.id);
                    
                    return (
                      <AnimatedCard key={opp.id} index={index}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) => theme.shadows[8],
                            },
                          }}
                          onClick={() => navigate(`/opportunity/${opp.id}`)}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                              {/* Левая часть */}
                              <Grid size={{ xs: 12, sm: 8 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                  <Chip
                                    label={typeInfo.label}
                                    size="small"
                                    icon={typeInfo.icon}
                                    sx={{
                                      bgcolor: alpha(typeInfo.color, 0.1),
                                      color: typeInfo.color,
                                      fontWeight: 500,
                                    }}
                                  />
                                  {opp.company_name && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {opp.company_name}
                                      </Typography>
                                    </Box>
                                  )}
                                  {opp.company_is_verified && (
                                    <Tooltip title="Верифицированная компания">
                                      <VerifiedIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                                    </Tooltip>
                                  )}
                                </Box>

                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                  {opp.title}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {opp.description.length > 120 ? opp.description.substring(0, 120) + '...' : opp.description}
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOnIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {opp.location_city || 'Не указан'}
                                    </Typography>
                                  </Box>
                                  <Chip label={getWorkFormatLabel(opp.work_format)} size="small" variant="outlined" />
                                  {opp.salary_from && opp.salary_to && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <AttachMoneyIcon fontSize="small" color="success" />
                                      <Typography variant="body2" fontWeight="medium" color="success.main">
                                        {opp.salary_from.toLocaleString()} - {opp.salary_to.toLocaleString()} ₽
                                      </Typography>
                                    </Box>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Опубликовано: {new Date(opp.publication_date).toLocaleDateString('ru-RU')}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {opp.tags?.slice(0, 5).map((tag: string) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 1.5 }}
                                    />
                                  ))}
                                  {opp.tags?.length > 5 && (
                                    <Chip label={`+${opp.tags.length - 5}`} size="small" variant="outlined" />
                                  )}
                                </Box>
                              </Grid>

                              {/* Правая часть - действия */}
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                                    gap: 1,
                                    height: '100%',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Tooltip title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}>
                                    <IconButton
                                      onClick={(e) => handleToggleFavorite(opp.id, e)}
                                      color={isFavorite ? 'error' : 'default'}
                                      sx={{
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.1)' },
                                      }}
                                    >
                                      {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                  </Tooltip>
                                  <Zoom in timeout={300}>
                                    <Button
                                      variant="contained"
                                      size="large"
                                      onClick={(e) => handleApply(opp.id, e)}
                                      disabled={applying === opp.id}
                                      sx={{
                                        borderRadius: 2,
                                        px: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                      }}
                                    >
                                      {applying === opp.id ? <CircularProgress size={24} color="inherit" /> : 'Откликнуться'}
                                    </Button>
                                  </Zoom>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </AnimatedCard>
                    );
                  })}
                </Stack>
              )}

              {/* Пагинация внизу */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Mobile filters drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: '85%', maxWidth: 320, borderRadius: 2 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Фильтры
            </Typography>
            <IconButton onClick={() => setMobileFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
        </Box>
      </Drawer>
    </Box>
  );
};

export default HomePage;