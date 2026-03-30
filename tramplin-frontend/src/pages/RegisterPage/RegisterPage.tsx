import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  Fade,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Mail, Lock, User, GraduationCap, Building2, Globe, Briefcase, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'seeker' as 'seeker' | 'employer' | 'curator',
    full_name: '',
    university: '',
    graduation_year: '',
    about: '',
    skills: '',
    company_name: '',
    description: '',
    industry: '',
    website: '',
    inn: '',
    corporate_email_domain: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      const userData: any = { email: formData.email, password: formData.password, role: formData.role };

      if (formData.role === 'seeker') {
        userData.full_name = formData.full_name;
        userData.university = formData.university;
        userData.graduation_year = parseInt(formData.graduation_year) || undefined;
        userData.about = formData.about;
        userData.skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      } else if (formData.role === 'employer') {
        userData.company_name = formData.company_name;
        userData.description = formData.description;
        userData.industry = formData.industry;
        userData.website = formData.website;
        userData.inn = formData.inn;
        userData.corporate_email_domain = formData.corporate_email_domain;
      }

      await dispatch(register(userData) as any).unwrap();
      toast.success('Регистрация успешна!');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
      toast.error('Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 4, bgcolor: '#F5F7FA' }}>
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid #E8EDF2' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#0F2B3D', mb: 1 }}>
                Создать аккаунт
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A6E7C' }}>
                Присоединяйтесь к платформе Трамплин
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                <FormLabel sx={{ color: '#0F2B3D', fontWeight: 500 }}>Выберите роль</FormLabel>
                <RadioGroup row name="role" value={formData.role} onChange={handleChange}>
                  <FormControlLabel value="seeker" control={<Radio />} label="Соискатель" />
                  <FormControlLabel value="employer" control={<Radio />} label="Работодатель" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color="#5A6E7C" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Пароль"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} color="#5A6E7C" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Подтверждение"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} color="#5A6E7C" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {formData.role === 'seeker' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="ФИО"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={18} color="#5A6E7C" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="ВУЗ"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GraduationCap size={18} color="#5A6E7C" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Год выпуска"
                    name="graduation_year"
                    type="number"
                    value={formData.graduation_year}
                    onChange={handleChange}
                    margin="normal"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Навыки (через запятую)"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    margin="normal"
                    placeholder="React, Python, JavaScript"
                  />
                </Box>
              )}

              {formData.role === 'employer' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Название компании"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Building2 size={18} color="#5A6E7C" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Описание"
                    name="description"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={handleChange}
                    margin="normal"
                    sx={{ mb: 2 }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Сфера деятельности"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Сайт"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Globe size={18} color="#5A6E7C" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    label="ИНН"
                    name="inn"
                    value={formData.inn}
                    onChange={handleChange}
                    margin="normal"
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Домен корпоративной почты"
                    name="corporate_email_domain"
                    value={formData.corporate_email_domain}
                    onChange={handleChange}
                    margin="normal"
                    placeholder="company.com"
                  />
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  bgcolor: '#0F2B3D',
                  '&:hover': { bgcolor: '#1E3A4D' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
              </Button>

              <Divider sx={{ my: 3 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" underline="hover" sx={{ color: '#0F2B3D' }}>
                  Уже есть аккаунт? Войдите
                </Link>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default RegisterPage;