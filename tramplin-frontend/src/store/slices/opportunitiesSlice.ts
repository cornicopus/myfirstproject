import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { opportunitiesService } from '../../services/opportunitiesService';

export interface Opportunity {
  id: number;
  title: string;
  description: string;
  company_name: string;
  company_logo?: string;
  type: string;
  work_format: string;
  location_city?: string;
  location_address?: string;
  lat: number;
  lon: number;
  salary_from?: number;
  salary_to?: number;
  tags: string[];
  company_id: number;
  publication_date: string;
  is_active: boolean;
}

export interface Filters {
  search?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  workFormat?: string[];
  type?: string[];
}

interface OpportunitiesState {
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  totalCountAll: number;
  currentPage: number;
}

const initialState: OpportunitiesState = {
  opportunities: [],
  selectedOpportunity: null,
  filters: {
    search: '',
    skills: [],
    salaryMin: 0,
    salaryMax: 500000,
    workFormat: [],
    type: [],
  },
  isLoading: false,
  error: null,
  totalCount: 0,
  totalCountAll: 0,
  currentPage: 1,
};

// Получение вакансий с учетом границ карты
export const fetchOpportunities = createAsyncThunk(
  'opportunities/fetch',
  async ({ bounds, filters, page }: { bounds?: any; filters?: Filters; page?: number }) => {
    const response = await opportunitiesService.getOpportunities(bounds, filters, page);
    return response;
  }
);

// Получение общего количества всех вакансий (без фильтрации по карте)
export const fetchTotalCount = createAsyncThunk(
  'opportunities/fetchTotalCount',
  async (filters: Filters) => {
    const response = await opportunitiesService.getOpportunities(null, filters, 1);
    return response.total;
  }
);

// Получение вакансии по ID
export const fetchOpportunityById = createAsyncThunk(
  'opportunities/fetchById',
  async (id: number) => {
    const response = await opportunitiesService.getOpportunityById(id);
    return response;
  }
);

// Создание вакансии
export const createOpportunity = createAsyncThunk(
  'opportunities/create',
  async (data: any) => {
    const response = await opportunitiesService.createOpportunity(data);
    return response;
  }
);

// Обновление вакансии
export const updateOpportunity = createAsyncThunk(
  'opportunities/update',
  async ({ id, data }: { id: number; data: any }) => {
    const response = await opportunitiesService.updateOpportunity(id, data);
    return response;
  }
);

// Удаление вакансии
export const deleteOpportunity = createAsyncThunk(
  'opportunities/delete',
  async (id: number) => {
    await opportunitiesService.deleteOpportunity(id);
    return id;
  }
);

const opportunitiesSlice = createSlice({
  name: 'opportunities',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOpportunities
      .addCase(fetchOpportunities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOpportunities.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload && action.payload.items) {
          state.opportunities = action.payload.items;
          state.totalCount = action.payload.total;
        } else {
          state.opportunities = [];
          state.totalCount = 0;
        }
      })
      .addCase(fetchOpportunities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch opportunities';
        console.error('fetchOpportunities error:', action.error);
      })
      
      // fetchTotalCount
      .addCase(fetchTotalCount.fulfilled, (state, action) => {
        state.totalCountAll = action.payload;
      })
      .addCase(fetchTotalCount.rejected, (state, action) => {
        console.error('fetchTotalCount error:', action.error);
        state.totalCountAll = 0;
      })
      
      // fetchOpportunityById
      .addCase(fetchOpportunityById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOpportunityById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOpportunity = action.payload;
      })
      .addCase(fetchOpportunityById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch opportunity';
      })
      
      // createOpportunity
      .addCase(createOpportunity.fulfilled, (state, action) => {
        // Обновляем общее количество после создания
        state.totalCountAll += 1;
        state.currentPage = 1;
      })
      .addCase(createOpportunity.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create opportunity';
      })
      
      // updateOpportunity
      .addCase(updateOpportunity.fulfilled, (state, action) => {
        const index = state.opportunities.findIndex(opp => opp.id === action.payload.id);
        if (index !== -1) {
          state.opportunities[index] = action.payload;
        }
        if (state.selectedOpportunity?.id === action.payload.id) {
          state.selectedOpportunity = action.payload;
        }
      })
      .addCase(updateOpportunity.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update opportunity';
      })
      
      // deleteOpportunity
      .addCase(deleteOpportunity.fulfilled, (state, action) => {
        state.opportunities = state.opportunities.filter(opp => opp.id !== action.payload);
        state.totalCount -= 1;
        state.totalCountAll -= 1;
        if (state.selectedOpportunity?.id === action.payload) {
          state.selectedOpportunity = null;
        }
      })
      .addCase(deleteOpportunity.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete opportunity';
      });
  },
});

export const { setFilters, clearFilters, setCurrentPage } = opportunitiesSlice.actions;
export default opportunitiesSlice.reducer;