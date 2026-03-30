import React from 'react';
import { Box, Container, Typography, Grid, Link, Divider, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#0F2B3D',
        color: '#FFFFFF',
        mt: 'auto',
        py: 4,
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* О компании */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#E6B17E' }}>
              КодИнсайт
            </Typography>
            <Typography variant="body2" sx={{ color: '#9AAEB9', lineHeight: 1.6 }}>
              Компания, специализирующаяся на создании цифровых экосистем для образования и бизнеса.
              Наша миссия — помогать талантливым студентам и выпускникам строить успешную карьеру в IT.
            </Typography>
          </Grid>

          {/* О платформе */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#E6B17E' }}>
              О платформе
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: '#9AAEB9' }}>
                «Трамплин» — это экосистема, где студенты не просто ищут работу, а строят карьеру с нуля:
                находят менторов, участвуют в карьерных мероприятиях компаний и получают предложения
                о стажировках, основываясь на своих навыках и активности.
              </Typography>
            </Stack>
          </Grid>

          {/* Контакты */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#E6B17E' }}>
              Контакты
            </Typography>
            <Stack spacing={1}>
              <Link
                href="mailto:info@codinsight.ru"
                sx={{ color: '#9AAEB9', textDecoration: 'none', '&:hover': { color: '#E6B17E' } }}
              >
                info@codinsight.ru
              </Link>
              <Link
                href="https://codinsight.ru"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#9AAEB9', textDecoration: 'none', '&:hover': { color: '#E6B17E' } }}
              >
                codinsight.ru
              </Link>
              <Typography variant="body2" sx={{ color: '#9AAEB9', mt: 1 }}>
                © {currentYear} КодИнсайт. Все права защищены.
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />

        <Typography variant="caption" sx={{ color: '#5A6E7C', display: 'block', textAlign: 'center' }}>
          Платформа «Трамплин» — создана для объединения талантливых студентов, выпускников и работодателей.
          Ваше будущее начинается здесь.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;