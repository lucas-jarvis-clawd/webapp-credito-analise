import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Settings,
  Assessment,
  CreditCard,
  AccountCircle,
  Logout,
  Notifications,
  Search,
  Help
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    description: 'Visão geral dos clientes'
  },
  {
    text: 'Análise de Clientes',
    icon: <People />,
    path: '/clients',
    description: 'Gerenciar clientes'
  },
  {
    text: 'Configurar Métricas',
    icon: <Settings />,
    path: '/metrics-config',
    description: 'Configuração de ponderação'
  },
  {
    text: 'Relatórios',
    icon: <Assessment />,
    path: '/reports',
    description: 'Relatórios e estatísticas'
  }
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const isMenuItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box>
      {/* Logo and Brand */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <CreditCard sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h6" fontWeight="bold">
            CreditAnalyzer
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Sistema Inteligente de Análise de Crédito
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {user?.name.charAt(0)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'admin' ? 'Administrador' : 'Analista'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <Tooltip title={item.description} placement="right">
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  bgcolor: isMenuItemActive(item.path) ? 'primary.main' : 'transparent',
                  color: isMenuItemActive(item.path) ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: isMenuItemActive(item.path) ? 'primary.dark' : 'grey.100'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isMenuItemActive(item.path) ? 'white' : 'primary.main',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isMenuItemActive(item.path) ? 600 : 400,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Quick Actions */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block' }}>
          AÇÕES RÁPIDAS
        </Typography>
        <List dense>
          <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Search fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Buscar Cliente" 
              primaryTypographyProps={{ fontSize: 13 }}
            />
          </ListItemButton>
          <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Ajuda" 
              primaryTypographyProps={{ fontSize: 13 }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname.includes('/client/') && !location.pathname.includes('/credit-limit') && 'Análise do Cliente'}
            {location.pathname.includes('/credit-limit') && 'Configurar Limite'}
            {location.pathname === '/metrics-config' && 'Configuração de Métricas'}
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notificações">
            <IconButton color="inherit" sx={{ mr: 2 }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Perfil do usuário">
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Meu Perfil
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
          pt: 8 // Account for AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;