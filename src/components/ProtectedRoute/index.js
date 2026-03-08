import React from "react"
import PropTypes from "prop-types"
import { navigate } from "gatsby"
import { useAuth, ROLES } from "../../context/AuthContext"
import CircularProgress from "@material-ui/core/CircularProgress"
import { makeStyles } from "@material-ui/core/styles"

const useStyles = makeStyles({
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  unauthorizedContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    textAlign: "center",
    padding: "20px",
  },
  unauthorizedTitle: {
    fontSize: "2rem",
    color: "#E34964",
    marginBottom: "1rem",
  },
  unauthorizedMessage: {
    fontSize: "1.2rem",
    color: "#666",
    marginBottom: "2rem",
  },
  loginButton: {
    padding: "12px 24px",
    fontSize: "1rem",
    backgroundColor: "#009688",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    "&:hover": {
      backgroundColor: "#00796b",
    },
  },
})

const ProtectedRoute = ({
  children,
  requiredRole = ROLES.USER,
  requiredPermission = null,
  fallback = null,
  redirectTo = "/login",
}) => {
  const classes = useStyles()
  const { isAuthenticated, isLoading, hasRole, hasPermission, user } = useAuth()

  if (isLoading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={60} thickness={4} />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      navigate(redirectTo, { state: { from: window.location.pathname } })
    }
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={60} thickness={4} />
      </div>
    )
  }

  const hasRequiredRole = hasRole(requiredRole)
  const hasRequiredPermission = requiredPermission
    ? hasPermission(requiredPermission)
    : true

  if (!hasRequiredRole || !hasRequiredPermission) {
    if (fallback) {
      return fallback
    }

    return (
      <div className={classes.unauthorizedContainer}>
        <h1 className={classes.unauthorizedTitle}>Access Denied</h1>
        <p className={classes.unauthorizedMessage}>
          You don't have permission to access this page.
          <br />
          Required role: {requiredRole}
          {requiredPermission && (
            <>
              <br />
              Required permission: {requiredPermission}
            </>
          )}
        </p>
        <button
          className={classes.loginButton}
          onClick={() => navigate("/")}
        >
          Go to Home
        </button>
      </div>
    )
  }

  return <>{children}</>
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(Object.values(ROLES)),
  requiredPermission: PropTypes.string,
  fallback: PropTypes.node,
  redirectTo: PropTypes.string,
}

export default ProtectedRoute
