import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Pagination,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { toggleFavorite } from '../../store/slices/favoritesSlice';
import { setCurrentPage } from '../../store/slices/opportunitiesSlice';
import { useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const OpportunityList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { opportunities, totalCount, currentPage } = useSelector(
    (state: RootState) => state.opportunities
  );
  const { favorites } = useSelector((state: RootState) => state.favorites);

  const handleToggleFavorite = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    dispatch(toggleFavorite(id) as any);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {opportunities.map((opp, index) => (
          <React.Fragment key={opp.id}>
            <ListItem
              alignItems="flex-start"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/opportunity/${opp.id}`)}
            >
              <ListItemAvatar>
                <Avatar src={opp.companyLogo} variant="rounded">
                  <BusinessCenterIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" component="span" fontWeight="bold">
                      {opp.title}
                    </Typography>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleToggleFavorite(e, opp.id)}
                      color={favorites.includes(opp.id) ? 'error' : 'default'}
                    >
                      {favorites.includes(opp.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography component="span" variant="body2" color="text.primary">
                      {opp.companyName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {opp.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {opp.tags?.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                    {opp.salary && (
                      <Typography variant="body2" color="primary.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                        {opp.salary.from.toLocaleString()} - {opp.salary.to.toLocaleString()} ₽
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {index < opportunities.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default OpportunityList;