import React from "react"
import PropTypes from "prop-types"
import { useAuth, ROLES } from "../../context/AuthContext"
import { makeStyles } from "@material-ui/core/styles"
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Paper,
  Avatar,
  Button,
  Divider,
  Box,
} from "@material-ui/core"
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
} from "@material-ui/icons"
import { navigate } from "gatsby"

const drawerWidth = 240

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    backgroundColor: "#009688",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: "#f5f5f5",
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    marginLeft: drawerWidth,
    minHeight: "100vh",
  },
  userSection: {
    padding: theme.spacing(2),
    textAlign: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    margin: "0 auto",
    marginBottom: theme.spacing(1),
    backgroundColor: "#009688",
  },
  welcomeText: {
    marginBottom: theme.spacing(0.5),
  },
  roleChip: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "16px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#009688",
    color: "white",
    marginTop: theme.spacing(0.5),
  },
  statsCard: {
    padding: theme.spacing(3),
    textAlign: "center",
    height: "100%",
    transition: "transform 0.2s",
    "&:hover": {
      transform: "translateY(-4px)",
    },
  },
  statNumber: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#009688",
    marginBottom: theme.spacing(1),
  },
  statLabel: {
    color: "#666",
    fontSize: "1rem",
  },
  sectionTitle: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(4),
    color: "#333",
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: "auto",
    margin: theme.spacing(2),
  },
  menuItem: {
    "&:hover": {
      backgroundColor: "#e0e0e0",
    },
  },
  activeMenuItem: {
    backgroundColor: "#009688",
    color: "white",
    "&:hover": {
      backgroundColor: "#00796b",
    },
  },
}))

const AdminDashboard = ({ title = "Admin Dashboard" }) => {
  const classes = useStyles()
  const { user, logout, hasRole, hasPermission } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const stats = [
    { label: "Total Users", value: "1,234", icon: <PeopleIcon /> },
    { label: "Active Sessions", value: "89", icon: <AssessmentIcon /> },
    { label: "Security Alerts", value: "3", icon: <SecurityIcon /> },
  ]

  const menuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
    ...(hasRole(ROLES.ADMIN)
      ? [{ label: "Users", icon: <PeopleIcon />, path: "/admin/users" }]
      : []),
    ...(hasPermission("manage_settings")
      ? [{ label: "Settings", icon: <SettingsIcon />, path: "/admin/settings" }]
      : []),
    ...(hasPermission("view_analytics")
      ? [{ label: "Analytics", icon: <AssessmentIcon />, path: "/admin/analytics" }]
      : []),
  ]

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >
        <div className={classes.toolbar} />
        <Divider />
        
        <Box className={classes.userSection}>
          <Avatar className={classes.avatar}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Avatar>
          <Typography variant="subtitle1" className={classes.welcomeText}>
            Welcome, {user?.name || "User"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email}
          </Typography>
          <span className={classes.roleChip}>{user?.role}</span>
        </Box>

        <Divider />

        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.label}
              className={classes.menuItem}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>

        <Divider />

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          className={classes.logoutButton}
          fullWidth
        >
          Logout
        </Button>
      </Drawer>

      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Container maxWidth="lg">
          <Typography variant="h4" className={classes.sectionTitle}>
            Dashboard Overview
          </Typography>

          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} key={stat.label}>
                <Paper className={classes.statsCard} elevation={2}>
                  <Box color="primary.main" mb={1}>
                    {stat.icon}
                  </Box>
                  <Typography className={classes.statNumber}>
                    {stat.value}
                  </Typography>
                  <Typography className={classes.statLabel}>
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h4" className={classes.sectionTitle}>
            Quick Actions
          </Typography>

          <Grid container spacing={3}>
            {hasRole(ROLES.ADMIN) && (
              <Grid item xs={12} sm={6} md={4}>
                <Paper className={classes.statsCard} elevation={2}>
                  <Typography variant="h6" gutterBottom>
                    User Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Manage users, roles, and permissions
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/admin/users")}
                  >
                    Manage Users
                  </Button>
                </Paper>
              </Grid>
            )}

            {hasPermission("manage_settings") && (
              <Grid item xs={12} sm={6} md={4}>
                <Paper className={classes.statsCard} elevation={2}>
                  <Typography variant="h6" gutterBottom>
                    System Settings
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Configure system preferences
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/admin/settings")}
                  >
                    Open Settings
                  </Button>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={4}>
              <Paper className={classes.statsCard} elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Profile Settings
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Update your profile information
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/admin/profile")}
                >
                  Edit Profile
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Box mt={4} p={2} bgcolor="#f5f5f5" borderRadius={4}>
            <Typography variant="h6" gutterBottom>
              Your Permissions
            </Typography>
            <Grid container spacing={1}>
              {user?.permissions?.map((permission) => (
                <Grid item key={permission}>
                  <Box
                    component="span"
                    px={2}
                    py={0.5}
                    bgcolor="#009688"
                    color="white"
                    borderRadius={16}
                    fontSize="0.875rem"
                  >
                    {permission}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </main>
    </div>
  )
}

AdminDashboard.propTypes = {
  title: PropTypes.string,
}

export default AdminDashboard
