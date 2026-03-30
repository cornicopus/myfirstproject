import { Card, CardContent, styled } from '@mui/material';

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: '1px solid #E8EDF2',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    borderColor: '#E6B17E',
  },
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  border: '1px solid #E8EDF2',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}));