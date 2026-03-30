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
  Chip,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createOpportunity, 
  fetchOpportunities, 
  deleteOpportunity,
  updateOpportunity 
} from '../../store/slices/opportunitiesSlice';
import { usersService } from '../../services/usersService';
import { applicationsService } from '../../services/applicationsService';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  const { opportunities } = useSelector((state: any) => state.opportunities);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  
  // Диалоги
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applicationsDialogOpen, setApplicationsDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  
  // Диалог редактирования компании
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState({
    company_name: '',
    description: '',
    industry: '',
    website: '',
  });
  const [savingCompany, setSavingCompany] = useState(false);
  
  // Диалог просмотра профиля соискателя
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedSeeker, setSelectedSeeker] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Формы
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    type: 'job',
    work_format: 'hybrid',
    location_city: 'Москва',
    lat: 55.7558,
    lon: 37.6173,
    salary_from: '',
    salary_to: '',
    tags: '',
  });
  
  const [editOpportunity, setEditOpportunity] = useState<any>({
    title: '',
    description: '',
    type: 'job',
    work_format: 'hybrid',
    location_city: '',
    salary_from: '',
    salary_to: '',
    tags: [],
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileData = await usersService.getEmployerProfile();
      setProfile(profileData);
      
      await dispatch(fetchOpportunities({ page: 1 }) as any);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (opportunityId: number) => {
    try {
      const apps = await applicationsService.getApplicationsForOpportunity(opportunityId);
      setApplications(apps);
    } catch (error) {
      toast.error('Ошибка загрузки откликов');
    }
  };

  const myOpportunities = opportunities.filter((opp: any) => opp.company_id === user?.id);
  
  // Проверка верификации компании
  const isVerified = profile?.is_verified === true;
  
  // Подсчет статистики
  const totalVacancies = myOpportunities.length;
  const activeVacancies = myOpportunities.filter((o: any) => o.is_active).length;
  const closedVacancies = totalVacancies - activeVacancies;
  
  // Данные для линейного графика (по месяцам)
  const getMonthlyData = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }
    
    const monthlyCounts = last6Months.map(month => {
      const count = myOpportunities.filter((opp: any) => {
        const oppDate = new Date(opp.publication_date);
        const oppMonth = months[oppDate.getMonth()];
        return oppMonth === month;
      }).length;
      return { month, count };
    });
    
    return monthlyCounts;
  };
  
  const monthlyData = getMonthlyData();

  // Редактирование компании
  const handleEditCompany = () => {
    setEditCompanyData({
      company_name: profile?.company_name || '',
      description: profile?.description || '',
      industry: profile?.industry || '',
      website: profile?.website || '',
    });
    setEditCompanyDialogOpen(true);
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await usersService.updateEmployerProfile(editCompanyData);
      toast.success('Информация о компании обновлена');
      setEditCompanyDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Ошибка обновления');
    } finally {
      setSavingCompany(false);
    }
  };

  // Создание вакансии (только для верифицированных)
  const handleCreateOpportunity = () => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    setCreateDialogOpen(true);
  };

  const handleSaveOpportunity = async () => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    
    if (!newOpportunity.title || !newOpportunity.description) {
      toast.error('Заполните название и описание');
      return;
    }
    
    try {
      await dispatch(createOpportunity({
        title: newOpportunity.title,
        description: newOpportunity.description,
        type: newOpportunity.type,
        work_format: newOpportunity.work_format,
        location_city: newOpportunity.location_city,
        lat: newOpportunity.lat,
        lon: newOpportunity.lon,
        salary_from: parseInt(newOpportunity.salary_from) || undefined,
        salary_to: parseInt(newOpportunity.salary_to) || undefined,
        tags: newOpportunity.tags.split(',').map(t => t.trim()).filter(t => t),
      }) as any).unwrap();
      
      toast.success('Вакансия создана!');
      setCreateDialogOpen(false);
      setNewOpportunity({
        title: '',
        description: '',
        type: 'job',
        work_format: 'hybrid',
        location_city: 'Москва',
        lat: 55.7558,
        lon: 37.6173,
        salary_from: '',
        salary_to: '',
        tags: '',
      });
      await dispatch(fetchOpportunities({ page: 1 }) as any);
    } catch (error) {
      toast.error('Ошибка создания вакансии');
    }
  };

  // Редактирование вакансии (только для верифицированных)
  const handleEditOpportunity = (opp: any) => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    setEditOpportunity({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      type: opp.type,
      work_format: opp.work_format,
      location_city: opp.location_city || '',
      salary_from: opp.salary_from || '',
      salary_to: opp.salary_to || '',
      tags: opp.tags || [],
      is_active: opp.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateOpportunity = async () => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    
    if (!editOpportunity.title || !editOpportunity.description) {
      toast.error('Заполните название и описание');
      return;
    }
    
    try {
      await dispatch(updateOpportunity({
        id: editOpportunity.id,
        data: {
          title: editOpportunity.title,
          description: editOpportunity.description,
          type: editOpportunity.type,
          work_format: editOpportunity.work_format,
          location_city: editOpportunity.location_city,
          salary_from: parseInt(editOpportunity.salary_from) || undefined,
          salary_to: parseInt(editOpportunity.salary_to) || undefined,
          tags: editOpportunity.tags,
          is_active: editOpportunity.is_active,
        }
      }) as any).unwrap();
      
      toast.success('Вакансия обновлена');
      setEditDialogOpen(false);
      await dispatch(fetchOpportunities({ page: 1 }) as any);
    } catch (error) {
      toast.error('Ошибка обновления вакансии');
    }
  };

  // Удаление вакансии (только для верифицированных)
  const handleDeleteClick = (id: number) => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    setDeleteTargetId(id);
    setConfirmDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteOpportunity(deleteTargetId) as any).unwrap();
      toast.success('Вакансия удалена');
      setConfirmDeleteDialogOpen(false);
      setDeleteTargetId(null);
      await dispatch(fetchOpportunities({ page: 1 }) as any);
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  // Просмотр откликов (только для верифицированных)
  const handleViewApplications = async (opp: any) => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    setSelectedOpportunity(opp);
    await loadApplications(opp.id);
    setApplicationsDialogOpen(true);
  };

  // Просмотр профиля соискателя
  const handleViewProfile = async (seekerId: number, seekerName: string) => {
    setLoadingProfile(true);
    try {
      const profileData = await usersService.getSeekerProfileById(seekerId);
      setSelectedSeeker({ ...profileData, name: seekerName, email: profileData.email });
      setProfileDialogOpen(true);
    } catch (error) {
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Управление статусом отклика (только для верифицированных)
  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    try {
      await applicationsService.updateApplicationStatus(applicationId, status);
      toast.success(`Статус отклика изменен на ${status === 'accepted' ? 'Принят' : status === 'rejected' ? 'Отклонен' : 'В резерве'}`);
      if (selectedOpportunity) {
        await loadApplications(selectedOpportunity.id);
      }
    } catch (error) {
      toast.error('Ошибка изменения статуса');
    }
  };

  // Закрытие вакансии (только для верифицированных)
  const handleCloseOpportunity = async (id: number) => {
    if (!isVerified) {
      toast.error('Ваша компания не верифицирована. Дождитесь верификации куратором.');
      return;
    }
    try {
      await dispatch(updateOpportunity({
        id,
        data: { is_active: false }
      }) as any).unwrap();
      toast.success('Вакансия закрыта');
      await dispatch(fetchOpportunities({ page: 1 }) as any);
    } catch (error) {
      toast.error('Ошибка закрытия вакансии');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'reserve': return 'info';
      default: return 'default';
    }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если компания не верифицирована - показываем информационное сообщение
  if (!isVerified) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: '#FFF8E7', border: '1px solid #FFE0B2' }}>
          <WarningAmberIcon sx={{ fontSize: 64, color: '#ED6C02', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} sx={{ color: '#ED6C02', mb: 2 }}>
            Ваша компания не верифицирована
          </Typography>
          <Typography variant="body1" sx={{ color: '#5A6E7C', mb: 1 }}>
            Уважаемый представитель компании "{profile?.company_name || 'Компания'}"!
          </Typography>
          <Typography variant="body1" sx={{ color: '#5A6E7C', mb: 3 }}>
            Для доступа к полному функционалу платформы необходимо дождаться верификации вашей компании куратором.
            После верификации вам станут доступны: создание и редактирование вакансий, просмотр и управление откликами соискателей.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ borderColor: '#E8EDF2', color: '#0F2B3D' }}
            >
              На главную
            </Button>
            <Button
              variant="contained"
              onClick={handleEditCompany}
              sx={{ bgcolor: '#0F2B3D', '&:hover': { bgcolor: '#1E3A4D' } }}
            >
              Редактировать информацию о компании
            </Button>
          </Box>
          <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: '#ED6C02' }}>
              <strong>Статус:</strong> Ожидает проверки куратором. Обычно это занимает не более 24 часов.
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Информация о компании */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E8EDF2' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#0F2B3D' }}>
              <BusinessIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#0F2B3D' }}>
                {profile?.company_name || 'Компания'}
              </Typography>
              <Chip 
                icon={<VerifiedIcon />} 
                label="Верифицировано" 
                color="success" 
                size="small" 
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
              {profile?.description || 'Информация о компании'}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {profile?.industry && <Chip label={profile.industry} variant="outlined" size="small" />}
              {profile?.website && <Chip label={profile.website} variant="outlined" size="small" />}
            </Box>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />} 
              onClick={handleEditCompany}
              sx={{ borderColor: '#E8EDF2', color: '#0F2B3D' }}
            >
              Редактировать
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: 3, border: '1px solid #E8EDF2' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: '1px solid #E8EDF2' }}
        >
          <Tab label="Мои вакансии" icon={<WorkIcon />} iconPosition="start" />
          <Tab label="Статистика" icon={<PeopleIcon />} iconPosition="start" />
        </Tabs>

        {/* Мои вакансии */}
        <TabPanel value={tabValue} index={0}>
          {myOpportunities.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              У вас пока нет вакансий. Нажмите "Создать вакансию" чтобы добавить первую.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {myOpportunities.map((item: any) => (
                <Card 
                  key={item.id} 
                  sx={{ 
                    borderRadius: 2, 
                    border: '1px solid #E8EDF2', 
                    boxShadow: 'none',
                    width: '100%',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                            {item.title}
                          </Typography>
                          <Chip 
                            label={getTypeLabel(item.type)} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                          {!item.is_active && (
                            <Chip label="Закрыта" size="small" color="error" />
                          )}
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#5A6E7C', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="small" sx={{ color: '#9AAEB9' }} />
                            <Typography variant="body2">{item.location_city || 'Не указан'}</Typography>
                          </Box>
                          <Chip label={getWorkFormatLabel(item.work_format)} size="small" variant="outlined" />
                          {item.salary_from && item.salary_to && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AttachMoneyIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                              <Typography variant="body2" color="success.main" fontWeight={500}>
                                {item.salary_from.toLocaleString()} - {item.salary_to.toLocaleString()} ₽
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon fontSize="small" sx={{ color: '#9AAEB9' }} />
                            <Typography variant="caption" sx={{ color: '#9AAEB9' }}>
                              {new Date(item.publication_date).toLocaleDateString('ru-RU')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {item.tags?.slice(0, 5).map((tag: string) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                          {item.tags?.length > 5 && (
                            <Chip label={`+${item.tags.length - 5}`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        alignItems: 'center',
                        flexShrink: 0,
                      }}>
                        <Tooltip title="Просмотреть отклики">
                          <IconButton 
                            onClick={() => handleViewApplications(item)}
                            sx={{ color: '#0F2B3D' }}
                          >
                            <PeopleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton 
                            onClick={() => handleEditOpportunity(item)}
                            sx={{ color: '#0F2B3D' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton 
                            onClick={() => handleDeleteClick(item.id)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        {item.is_active && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleCloseOpportunity(item.id)}
                            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                          >
                            Закрыть
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateOpportunity}
              sx={{
                bgcolor: '#0F2B3D',
                '&:hover': { bgcolor: '#1E3A4D' },
                px: 4,
                py: 1,
                borderRadius: 2,
              }}
            >
              Создать вакансию
            </Button>
          </Box>
        </TabPanel>

        {/* Статистика */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid #E8EDF2', bgcolor: '#F8F9FC' }}>
                <Typography variant="h3" fontWeight={700} sx={{ color: '#0F2B3D' }}>
                  {totalVacancies}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6E7C', mt: 1 }}>
                  Всего вакансий
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid #E8EDF2', bgcolor: '#F8F9FC' }}>
                <Typography variant="h3" fontWeight={700} sx={{ color: '#2E7D32' }}>
                  {activeVacancies}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6E7C', mt: 1 }}>
                  Активных вакансий
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid #E8EDF2', bgcolor: '#F8F9FC' }}>
                <Typography variant="h3" fontWeight={700} sx={{ color: '#E6B17E' }}>
                  {closedVacancies}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6E7C', mt: 1 }}>
                  Закрытых вакансий
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3, p: 3, borderRadius: 2, border: '1px solid #E8EDF2' }}>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#0F2B3D', mb: 2 }}>
              Динамика создания вакансий
            </Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
                  <XAxis dataKey="month" stroke="#5A6E7C" />
                  <YAxis stroke="#5A6E7C" allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: '1px solid #E8EDF2',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0F2B3D" 
                    strokeWidth={2}
                    dot={{ fill: '#0F2B3D', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Количество вакансий"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </TabPanel>
      </Paper>

      {/* Диалог редактирования компании */}
      <Dialog open={editCompanyDialogOpen} onClose={() => setEditCompanyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Редактирование информации о компании
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditCompanyDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название компании"
            value={editCompanyData.company_name}
            onChange={(e) => setEditCompanyData({ ...editCompanyData, company_name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            multiline
            rows={3}
            value={editCompanyData.description}
            onChange={(e) => setEditCompanyData({ ...editCompanyData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Сфера деятельности"
            value={editCompanyData.industry}
            onChange={(e) => setEditCompanyData({ ...editCompanyData, industry: e.target.value })}
            margin="normal"
            placeholder="IT, Финансы, Образование..."
          />
          <TextField
            fullWidth
            label="Сайт компании"
            value={editCompanyData.website}
            onChange={(e) => setEditCompanyData({ ...editCompanyData, website: e.target.value })}
            margin="normal"
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCompanyDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCompany} 
            disabled={savingCompany}
            startIcon={savingCompany ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {savingCompany ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания вакансии */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Создание вакансии
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setCreateDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название вакансии"
            value={newOpportunity.title}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            multiline
            rows={4}
            value={newOpportunity.description}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип</InputLabel>
            <Select
              value={newOpportunity.type}
              onChange={(e) => setNewOpportunity({ ...newOpportunity, type: e.target.value })}
              label="Тип"
            >
              <MenuItem value="job">Вакансия</MenuItem>
              <MenuItem value="internship">Стажировка</MenuItem>
              <MenuItem value="mentorship">Менторство</MenuItem>
              <MenuItem value="event">Мероприятие</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Формат работы</InputLabel>
            <Select
              value={newOpportunity.work_format}
              onChange={(e) => setNewOpportunity({ ...newOpportunity, work_format: e.target.value })}
              label="Формат работы"
            >
              <MenuItem value="office">В офисе</MenuItem>
              <MenuItem value="hybrid">Гибрид</MenuItem>
              <MenuItem value="remote">Удаленно</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Город"
            value={newOpportunity.location_city}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, location_city: e.target.value })}
            margin="normal"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата от"
                type="number"
                value={newOpportunity.salary_from}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, salary_from: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата до"
                type="number"
                value={newOpportunity.salary_to}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, salary_to: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Теги (через запятую)"
            value={newOpportunity.tags}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, tags: e.target.value })}
            margin="normal"
            placeholder="React, TypeScript, Python"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveOpportunity}>Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования вакансии */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Редактирование вакансии
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название вакансии"
            value={editOpportunity.title}
            onChange={(e) => setEditOpportunity({ ...editOpportunity, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            multiline
            rows={4}
            value={editOpportunity.description}
            onChange={(e) => setEditOpportunity({ ...editOpportunity, description: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип</InputLabel>
            <Select
              value={editOpportunity.type}
              onChange={(e) => setEditOpportunity({ ...editOpportunity, type: e.target.value })}
              label="Тип"
            >
              <MenuItem value="job">Вакансия</MenuItem>
              <MenuItem value="internship">Стажировка</MenuItem>
              <MenuItem value="mentorship">Менторство</MenuItem>
              <MenuItem value="event">Мероприятие</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Формат работы</InputLabel>
            <Select
              value={editOpportunity.work_format}
              onChange={(e) => setEditOpportunity({ ...editOpportunity, work_format: e.target.value })}
              label="Формат работы"
            >
              <MenuItem value="office">В офисе</MenuItem>
              <MenuItem value="hybrid">Гибрид</MenuItem>
              <MenuItem value="remote">Удаленно</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Город"
            value={editOpportunity.location_city}
            onChange={(e) => setEditOpportunity({ ...editOpportunity, location_city: e.target.value })}
            margin="normal"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата от"
                type="number"
                value={editOpportunity.salary_from}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, salary_from: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата до"
                type="number"
                value={editOpportunity.salary_to}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, salary_to: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Теги (через запятую)"
            value={editOpportunity.tags.join(', ')}
            onChange={(e) => setEditOpportunity({ ...editOpportunity, tags: e.target.value.split(',').map(t => t.trim()) })}
            margin="normal"
            placeholder="React, TypeScript, Python"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editOpportunity.is_active}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, is_active: e.target.checked })}
                color="primary"
              />
            }
            label="Активна"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleUpdateOpportunity} startIcon={<SaveIcon />}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра откликов */}
      <Dialog open={applicationsDialogOpen} onClose={() => setApplicationsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Отклики на вакансию: {selectedOpportunity?.title}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setApplicationsDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {applications.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: '#5A6E7C' }}>
              Пока нет откликов на эту вакансию
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Соискатель</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Box>
                          <Typography fontWeight={500}>{app.seeker_name || 'Соискатель'}</Typography>
                          <Typography variant="caption" sx={{ color: '#5A6E7C' }}>{app.seeker_email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(app.applied_at).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(app.status)} 
                          color={getStatusColor(app.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                                startIcon={<CheckCircleIcon />}
                              >
                                Принять
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                startIcon={<CancelIcon />}
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                          {app.status === 'accepted' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'reserve')}
                            >
                              В резерв
                            </Button>
                          )}
                          {app.status === 'reserve' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            >
                              Принять
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewProfile(app.seeker_id, app.seeker_name)}
                          >
                            Профиль
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра профиля соискателя */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Профиль соискателя
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setProfileDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedSeeker ? (
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: '#0F2B3D' }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedSeeker.full_name || selectedSeeker.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                    {selectedSeeker.email}
                  </Typography>
                </Box>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0F2B3D', mb: 1 }}>
                  Образование
                </Typography>
                <Typography variant="body2">
                  {selectedSeeker.university || 'Не указано'}
                  {selectedSeeker.graduation_year && `, ${selectedSeeker.graduation_year}`}
                </Typography>
              </Box>
              
              {selectedSeeker.skills && selectedSeeker.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0F2B3D', mb: 1 }}>
                    Навыки
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedSeeker.skills.map((skill: string) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {selectedSeeker.about && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0F2B3D', mb: 1 }}>
                    О себе
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                    {selectedSeeker.about}
                  </Typography>
                </Box>
              )}
              
              {selectedSeeker.portfolio && selectedSeeker.portfolio.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0F2B3D', mb: 1 }}>
                    Портфолио / Репозитории
                  </Typography>
                  {selectedSeeker.portfolio.map((link: string, idx: number) => (
                    <Link key={idx} href={link} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', mb: 0.5 }}>
                      {link}
                    </Link>
                  ))}
                </Box>
              )}
            </Stack>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: '#5A6E7C' }}>
              Информация о соискателе не найдена
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={confirmDeleteDialogOpen} onClose={() => setConfirmDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить эту вакансию? Все связанные отклики также будут удалены.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployerDashboard;