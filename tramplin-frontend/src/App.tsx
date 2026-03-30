import { useEffect } from 'react';
import { RouterProvider, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { store } from './store';
import { theme } from './theme';
import { getCurrentUser } from './store/slices/authSlice';
import Footer from './components/common/Footer';
import { Box } from '@mui/material';

const AppInitializer = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: any) => state.auth);
  
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser() as any);
    }
  }, [token, user, dispatch]);
  
  return null;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" />
        <AppInitializer />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <RouterProvider router={router} />
        </Box>
      </ThemeProvider>
    </Provider>
  );
}

export default App;