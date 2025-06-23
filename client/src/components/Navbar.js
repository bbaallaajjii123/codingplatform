import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Code as CodeIcon,
  Leaderboard as LeaderboardIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { AddTeacherForm } from '../pages/Admin';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/');
  };

  const menuItems = [
    { text: 'Problems', icon: <CodeIcon />, path: '/problems' },
    { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
  ];

  const authenticatedMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Submissions', icon: <AssignmentIcon />, path: '/submissions' },
  ];

  const teacherMenuItem = isAuthenticated && user.role === 'admin'
    ? { text: 'Teacher', icon: <PersonIcon />, action: () => setTeacherDialogOpen(true) }
    : null;

  const adminMenuItem = isAuthenticated && (user.role === 'admin' || user.role === 'teacher')
    ? { text: 'Admin', icon: <SettingsIcon />, path: '/admin' }
    : null;

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CodeIcon color="primary" />
        <Typography variant="h6" component="div">
          Akshaya Coding Platform
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            button
            component={RouterLink}
            to={item.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {isAuthenticated && (
          <>
            <Divider />
            {authenticatedMenuItems.map((item) => (
              <ListItem
                key={item.text}
                button
                component={RouterLink}
                to={item.path}
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            {teacherMenuItem && (
              <ListItem
                key={teacherMenuItem.text}
                button
                onClick={() => { setTeacherDialogOpen(true); handleDrawerToggle(); }}
              >
                <ListItemIcon>{teacherMenuItem.icon}</ListItemIcon>
                <ListItemText primary={teacherMenuItem.text} />
              </ListItem>
            )}
            {adminMenuItem && (
              <ListItem
                key={adminMenuItem.text}
                button
                component={RouterLink}
                to={adminMenuItem.path}
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>{adminMenuItem.icon}</ListItemIcon>
                <ListItemText primary={adminMenuItem.text} />
              </ListItem>
            )}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <CodeIcon sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600
              }}
            >
              Akshaya Coding Platform
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
              {isAuthenticated && authenticatedMenuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
              {teacherMenuItem && (
                <Button
                  color="inherit"
                  startIcon={teacherMenuItem.icon}
                  onClick={teacherMenuItem.action}
                >
                  {teacherMenuItem.text}
                </Button>
              )}
              {adminMenuItem && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to={adminMenuItem.path}
                  startIcon={adminMenuItem.icon}
                >
                  {adminMenuItem.text}
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ ml: 2 }}>
            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {user?.points || 0} pts
                </Typography>
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Badge
                    badgeContent={user?.rank || 'Beginner'}
                    color="secondary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </Avatar>
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleProfileMenuClose}
                  >
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleProfileMenuClose}
                  >
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={RouterLink}
                  to="/register"
                  sx={{ color: 'white' }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>

      <AddTeacherForm open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} />
    </>
  );
};

export default Navbar; 