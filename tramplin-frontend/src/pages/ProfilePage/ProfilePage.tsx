import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4">Профиль пользователя</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Страница в разработке
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage;