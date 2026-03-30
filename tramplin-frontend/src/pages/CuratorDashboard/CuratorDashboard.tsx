import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { curatorService } from '../../services/curatorService';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CuratorDashboard: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingEmployers, setPendingEmployers] = useState<any[]>([]);
  const [pendingOpportunities, setPendingOpportunities] = useState<any[]>([]);
  const [allEmployers, setAllEmployers] = useState<any[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<any[]>([]);
  
  // Диалоги
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Диалог редактирования вакансии
  const [editOpportunityDialogOpen, setEditOpportunityDialogOpen] = useState(false);
  const [editOpportunityData, setEditOpportunityData] = useState<any>({
    title: '',
    description: '',
    type: 'job',
    work_format: 'hybrid',
    location_city: '',
    salary_from: '',
    salary_to: '',
    is_active: true,
  });
  const [currentOpportunityId, setCurrentOpportunityId] = useState<number | null>(null);
  
  // Диалог редактирования компании
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState<any>({
    company_name: '',
    description: '',
    industry: '',
    website: '',
    is_verified: false,
  });
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  
  // Диалог подтверждения удаления
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'company' | 'opportunity'; id: number; name: string } | null>(null);
  
  // Меню для списка
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'company' | 'opportunity'; id: number; data: any } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pending = await curatorService.getPendingEmployers();
      setPendingEmployers(pending);
      
      const allCompanies = await curatorService.getAllEmployers();
      setAllEmployers(allCompanies);
      
      const pendingOpps = await curatorService.getPendingOpportunities();
      setPendingOpportunities(pendingOpps);
      
      const allOpps = await curatorService.getAllOpportunities();
      setAllOpportunities(allOpps);
    } catch (error) {
      console.error('Error loading curator data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // ============ Обработчики для компаний ============
  
  const handleOpenCompanyDetails = (company: any) => {
    setSelectedCompany(company);
    setDetailsDialogOpen(true);
  };

  const handleEditCompany = (company: any) => {
    setCurrentCompanyId(company.user_id);
    setEditCompanyData({
      company_name: company.company_name,
      description: company.description || '',
      industry: company.industry || '',
      website: company.website || '',
      is_verified: company.is_verified,
    });
    setEditCompanyDialogOpen(true);
  };

  const handleSaveCompanyEdit = async () => {
    if (!currentCompanyId) return;
    setConfirming(true);
    try {
      await curatorService.updateEmployer(currentCompanyId, editCompanyData);
      toast.success('Компания обновлена');
      setEditCompanyDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Ошибка обновления');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteTarget || deleteTarget.type !== 'company') return;
    setDeleting(true);
    try {
      await curatorService.deleteEmployer(deleteTarget.id);
      toast.success(`Компания "${deleteTarget.name}" удалена`);
      setConfirmDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyCompany = async () => {
    if (!selectedCompany) return;
    setConfirming(true);
    try {
      await curatorService.verifyEmployer(selectedCompany.user_id);
      toast.success(`Компания "${selectedCompany.company_name}" верифицирована`);
      setDetailsDialogOpen(false);
      setSelectedCompany(null);
      loadData();
    } catch (error) {
      toast.error('Ошибка верификации');
    } finally {
      setConfirming(false);
    }
  };

  // ============ Обработчики для вакансий ============
  
  const handleEditOpportunity = (opp: any) => {
    setCurrentOpportunityId(opp.id);
    setEditOpportunityData({
      title: opp.title,
      description: opp.description || '',
      type: opp.type,
      work_format: opp.work_format,
      location_city: opp.location_city || '',
      salary_from: opp.salary_from || '',
      salary_to: opp.salary_to || '',
      is_active: opp.is_active,
    });
    setEditOpportunityDialogOpen(true);
  };

  const handleSaveOpportunityEdit = async () => {
    if (!currentOpportunityId) return;
    setConfirming(true);
    try {
      await curatorService.updateOpportunity(currentOpportunityId, editOpportunityData);
      toast.success('Вакансия обновлена');
      setEditOpportunityDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Ошибка обновления');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteOpportunity = async () => {
    if (!deleteTarget || deleteTarget.type !== 'opportunity') return;
    setDeleting(true);
    try {
      await curatorService.deleteOpportunity(deleteTarget.id);
      toast.success(`Вакансия "${deleteTarget.name}" удалена`);
      setConfirmDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveOpportunity = async (opportunityId: number) => {
    try {
      await curatorService.approveOpportunity(opportunityId);
      toast.success('Вакансия одобрена');
      loadData();
    } catch (error) {
      toast.error('Ошибка одобрения');
    }
  };

  const handleOpenRejectDialog = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectOpportunity = async () => {
    if (!selectedOpportunity) return;
    setRejecting(true);
    try {
      await curatorService.rejectOpportunity(selectedOpportunity.id, rejectReason);
      toast.success('Вакансия отклонена');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedOpportunity(null);
      loadData();
    } catch (error) {
      toast.error('Ошибка отклонения');
    } finally {
      setRejecting(false);
    }
  };

  // ============ Меню для списка ============
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, type: 'company' | 'opportunity', id: number, data: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ type, id, data });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleMenuEdit = () => {
    if (selectedItem?.type === 'company') {
      handleEditCompany(selectedItem.data);
    } else if (selectedItem?.type === 'opportunity') {
      handleEditOpportunity(selectedItem.data);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (selectedItem) {
      setDeleteTarget({
        type: selectedItem.type,
        id: selectedItem.id,
        name: selectedItem.type === 'company' ? selectedItem.data.company_name : selectedItem.data.title,
      });
      setConfirmDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ color: '#0F2B3D', mb: 3 }}>
        Панель куратора
      </Typography>

      <Paper sx={{ width: '100%', borderRadius: 3, border: '1px solid #E8EDF2' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #E8EDF2' }}
        >
          <Tab 
            label={`На модерации (${pendingEmployers.length + pendingOpportunities.length})`} 
            icon={<WarningIcon />} 
            iconPosition="start" 
          />
          <Tab label="Компании" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Вакансии" icon={<WorkIcon />} iconPosition="start" />
        </Tabs>

        {/* Панель модерации */}
        <TabPanel value={tabValue} index={0}>
          {pendingEmployers.length === 0 && pendingOpportunities.length === 0 ? (
            <Alert severity="info">Нет элементов на модерации</Alert>
          ) : (
            <>
              {pendingEmployers.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Компании на верификацию
                  </Typography>
                  {pendingEmployers.map((employer) => (
                    <Paper key={employer.user_id} sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid #E8EDF2' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ bgcolor: '#E6B17E20', color: '#E6B17E' }}>
                            <BusinessIcon />
                          </Avatar>
                        </Grid>
                        <Grid item xs>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {employer.company_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                            {employer.description?.substring(0, 100) || 'Нет описания'}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenCompanyDetails(employer)}
                            sx={{ bgcolor: '#0F2B3D', '&:hover': { bgcolor: '#1E3A4D' } }}
                          >
                            Проверить
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </>
              )}

              {pendingOpportunities.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Вакансии на модерацию
                  </Typography>
                  {pendingOpportunities.map((opp) => (
                    <Paper key={opp.id} sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid #E8EDF2' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ bgcolor: '#E6B17E20', color: '#E6B17E' }}>
                            <WorkIcon />
                          </Avatar>
                        </Grid>
                        <Grid item xs>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {opp.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                            {opp.company_name} • {opp.location_city} • {opp.work_format}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApproveOpportunity(opp.id)}
                            sx={{ mr: 1 }}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => handleOpenRejectDialog(opp)}
                          >
                            Отклонить
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </>
              )}
            </>
          )}
        </TabPanel>

        {/* Панель компаний */}
        <TabPanel value={tabValue} index={1}>
          {allEmployers.length === 0 ? (
            <Alert severity="info">Нет компаний для отображения</Alert>
          ) : (
            <List>
              {allEmployers.map((employer) => (
                <ListItem key={employer.user_id} divider>
                  <ListItemIcon>
                    <BusinessIcon sx={{ color: '#0F2B3D' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={500}>{employer.company_name}</Typography>
                      </Box>
                    }
                    secondary={`${employer.industry || 'Без сферы'} • ${employer.is_verified ? 'Верифицирована' : 'Не верифицирована'}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={employer.is_verified ? "Верифицировано" : "На проверке"}
                      color={employer.is_verified ? "success" : "warning"}
                      size="small"
                    />
                    <IconButton onClick={(e) => handleMenuOpen(e, 'company', employer.user_id, employer)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Панель вакансий */}
        <TabPanel value={tabValue} index={2}>
          {allOpportunities.length === 0 ? (
            <Alert severity="info">Нет вакансий для отображения</Alert>
          ) : (
            <List>
              {allOpportunities.map((opp) => (
                <ListItem key={opp.id} divider>
                  <ListItemIcon>
                    <WorkIcon sx={{ color: opp.is_active ? '#0F2B3D' : '#9AAEB9' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={500}>{opp.title}</Typography>
                        {!opp.is_active && (
                          <Chip label="Неактивна" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={`${opp.company_name || 'Неизвестна'} • ${opp.location_city || 'Не указан'}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={opp.is_active ? "Активна" : "Неактивна"}
                      color={opp.is_active ? "success" : "error"}
                      size="small"
                    />
                    <IconButton onClick={(e) => handleMenuOpen(e, 'opportunity', opp.id, opp)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>

      {/* Диалог с деталями компании */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Детали компании</Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCompany && (
            <Stack spacing={3}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                    Основная информация
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Название компании</Typography>
                      <Typography fontWeight={500}>{selectedCompany.company_name}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Описание</Typography>
                      <Typography>{selectedCompany.description || 'Не указано'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Сфера деятельности</Typography>
                      <Typography>{selectedCompany.industry || 'Не указана'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Сайт</Typography>
                      <Typography>
                        {selectedCompany.website ? (
                          <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" style={{ color: '#E6B17E' }}>
                            {selectedCompany.website}
                          </a>
                        ) : 'Не указан'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    <VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                    Данные для верификации
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>ИНН</Typography>
                      <Typography>{selectedCompany.verification_data?.inn || 'Не указан'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Домен корпоративной почты</Typography>
                      <Typography>{selectedCompany.verification_data?.corporate_email_domain || 'Не указан'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    <EmailIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                    Информация о пользователе
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Email</Typography>
                      <Typography>{selectedCompany.user?.email || 'Не указан'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#5A6E7C' }}>Дата регистрации</Typography>
                      <Typography>
                        {selectedCompany.user?.created_at 
                          ? new Date(selectedCompany.user.created_at).toLocaleDateString('ru-RU')
                          : 'Не указана'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              if (selectedCompany) {
                setDeleteTarget({
                  type: 'company',
                  id: selectedCompany.user_id,
                  name: selectedCompany.company_name,
                });
                setConfirmDeleteDialogOpen(true);
                setDetailsDialogOpen(false);
              }
            }}
          >
            <DeleteIcon sx={{ mr: 1 }} /> Удалить
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (selectedCompany) {
                setDetailsDialogOpen(false);
                handleEditCompany(selectedCompany);
              }
            }}
          >
            <EditIcon sx={{ mr: 1 }} /> Редактировать
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleVerifyCompany}
            disabled={confirming}
            startIcon={confirming ? <CircularProgress size={20} /> : <VerifiedIcon />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            {confirming ? 'Подтверждение...' : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования компании */}
      <Dialog open={editCompanyDialogOpen} onClose={() => setEditCompanyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Редактирование компании
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
          />
          <TextField
            fullWidth
            label="Сайт"
            value={editCompanyData.website}
            onChange={(e) => setEditCompanyData({ ...editCompanyData, website: e.target.value })}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editCompanyData.is_verified}
                onChange={(e) => setEditCompanyData({ ...editCompanyData, is_verified: e.target.checked })}
                color="primary"
              />
            }
            label="Верифицирована"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCompanyDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveCompanyEdit} disabled={confirming}>
            {confirming ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования вакансии */}
      <Dialog open={editOpportunityDialogOpen} onClose={() => setEditOpportunityDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Редактирование вакансии
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditOpportunityDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={editOpportunityData.title}
            onChange={(e) => setEditOpportunityData({ ...editOpportunityData, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Описание"
            multiline
            rows={3}
            value={editOpportunityData.description}
            onChange={(e) => setEditOpportunityData({ ...editOpportunityData, description: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип вакансии</InputLabel>
            <Select
              value={editOpportunityData.type}
              onChange={(e) => setEditOpportunityData({ ...editOpportunityData, type: e.target.value })}
              label="Тип вакансии"
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
              value={editOpportunityData.work_format}
              onChange={(e) => setEditOpportunityData({ ...editOpportunityData, work_format: e.target.value })}
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
            value={editOpportunityData.location_city}
            onChange={(e) => setEditOpportunityData({ ...editOpportunityData, location_city: e.target.value })}
            margin="normal"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата от"
                type="number"
                value={editOpportunityData.salary_from}
                onChange={(e) => setEditOpportunityData({ ...editOpportunityData, salary_from: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Зарплата до"
                type="number"
                value={editOpportunityData.salary_to}
                onChange={(e) => setEditOpportunityData({ ...editOpportunityData, salary_to: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
          <FormControlLabel
            control={
              <Switch
                checked={editOpportunityData.is_active}
                onChange={(e) => setEditOpportunityData({ ...editOpportunityData, is_active: e.target.checked })}
                color="primary"
              />
            }
            label="Активно"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpportunityDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveOpportunityEdit} disabled={confirming}>
            {confirming ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={confirmDeleteDialogOpen} onClose={() => setConfirmDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить {deleteTarget?.type === 'company' ? 'компанию' : 'вакансию'} "{deleteTarget?.name}"?
            {deleteTarget?.type === 'company' && ' Все вакансии этой компании также будут удалены.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={deleteTarget?.type === 'company' ? handleDeleteCompany : handleDeleteOpportunity} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отклонения вакансии */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отклонение вакансии</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Причина отклонения"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Укажите причину отклонения вакансии..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleRejectOpportunity} 
            color="error" 
            variant="contained"
            disabled={rejecting}
            startIcon={rejecting ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {rejecting ? 'Отклонение...' : 'Отклонить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Меню действий */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} /> Редактировать
        </MenuItem>
        <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} /> Удалить
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default CuratorDashboard;