import React, { useState } from "react"
import PropTypes from "prop-types"
import { navigate } from "gatsby"
import { useAuth } from "../../context/AuthContext"
import AnimatedLogin from "../AnimatedLogin"
import { makeStyles } from "@material-ui/core/styles"
import {
  Snackbar,
  Alert,
  Paper,
  Typography,
  Box,
  Chip,
} from "@material-ui/core"
import { AccountCircle, AdminPanelSettings } from "@material-ui/icons"

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    position: "relative",
  },
  demoCredentials: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    padding: theme.spacing(2),
    maxWidth: 300,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  credentialItem: {
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    borderRadius: theme.spacing(1),
  },
  roleChip: {
    marginTop: theme.spacing(0.5),
  },
  adminChip: {
    backgroundColor: "#E34964",
    color: "white",
  },
  userChip: {
    backgroundColor: "#009688",
    color: "white",
  },
}))

const LoginPage = ({
  redirectPath = "/admin",
  appName = "C2SI Admin Portal",
  typeWriterHeader = "Welcome to",
  typeWriteWords = ["Secure Admin Panel", "Role-Based Access", "Protected Dashboard"],
}) => {
  const classes = useStyles()
  const { login, isAuthenticated } = useAuth()
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  })
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath)
    }
  }, [isAuthenticated, redirectPath])

  const handleLogin = async (email, password) => {
    setIsLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      setSnackbar({
        open: true,
        message: `Welcome back, ${result.user.name}!`,
        severity: "success",
      })
      
      setTimeout(() => {
        navigate(redirectPath)
      }, 1000)
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Login failed",
        severity: "error",
      })
    }
    
    setIsLoading(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <div className={classes.root}>
      <AnimatedLogin
        name={appName}
        typeWriteWords={typeWriteWords}
        typeWriterHeader={typeWriterHeader}
        submitHandler={handleLogin}
        isLoading={isLoading}
      />

      <Paper className={classes.demoCredentials} elevation={3}>
        <Typography variant="h6" gutterBottom>
          Demo Credentials
        </Typography>
        
        <Box className={classes.credentialItem}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <AdminPanelSettings fontSize="small" style={{ marginRight: 8, color: "#E34964" }} />
            <Typography variant="subtitle2" fontWeight="bold">
              Admin Account
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Email: admin@example.com
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Password: admin123
          </Typography>
          <Chip
            label="Full Access"
            size="small"
            className={`${classes.roleChip} ${classes.adminChip}`}
          />
        </Box>

        <Box className={classes.credentialItem}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <AccountCircle fontSize="small" style={{ marginRight: 8, color: "#009688" }} />
            <Typography variant="subtitle2" fontWeight="bold">
              User Account
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Email: user@example.com
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Password: user123
          </Typography>
          <Chip
            label="Read Only"
            size="small"
            className={`${classes.roleChip} ${classes.userChip}`}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

LoginPage.propTypes = {
  redirectPath: PropTypes.string,
  appName: PropTypes.string,
  typeWriterHeader: PropTypes.string,
  typeWriteWords: PropTypes.array,
}

export default LoginPage
