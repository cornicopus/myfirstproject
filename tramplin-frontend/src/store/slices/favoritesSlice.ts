import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoritesService } from '../../services/favoritesService';

interface FavoritesState {
  favorites: number[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  error: null,
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetch',
  async (_, { getState }) => {
    const state = getState() as any;
    const isAuth = !!state.auth.token;
    
    if (isAuth) {
      const response = await favoritesService.getFavorites();
      return response;
    } else {
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      return localFavorites;
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggle',
  async (opportunityId: number, { getState }) => {
    const state = getState() as any;
    const isAuth = !!state.auth.token;
    
    if (isAuth) {
      const response = await favoritesService.toggleFavorite(opportunityId);
      return { opportunityId, isFavorite: response.is_favorite };
    } else {
      let favorites: number[] = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.indexOf(opportunityId);
      
      if (index === -1) {
        favorites.push(opportunityId);
      } else {
        favorites.splice(index, 1);
      }
      
      localStorage.setItem('favorites', JSON.stringify(favorites));
      return { opportunityId, isFavorite: index === -1 };
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.favorites = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { opportunityId, isFavorite } = action.payload;
        if (isFavorite) {
          state.favorites.push(opportunityId);
        } else {
          state.favorites = state.favorites.filter(id => id !== opportunityId);
        }
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;