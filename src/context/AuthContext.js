import React, { createContext, useState, useContext, useEffect } from "react"
import PropTypes from "prop-types"

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("webiu_user")
    const storedToken = localStorage.getItem("webiu_token")
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        logout()
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (email === "admin@example.com" && password === "admin123") {
        const userData = {
          id: "1",
          email: email,
          name: "Admin User",
          role: ROLES.ADMIN,
          permissions: ["read", "write", "delete", "manage_users"],
        }
        
        const token = btoa(JSON.stringify({ email, role: ROLES.ADMIN, timestamp: Date.now() }))
        
        localStorage.setItem("webiu_user", JSON.stringify(userData))
        localStorage.setItem("webiu_token", token)
        
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      } else if (email === "user@example.com" && password === "user123") {
        const userData = {
          id: "2",
          email: email,
          name: "Regular User",
          role: ROLES.USER,
          permissions: ["read"],
        }
        
        const token = btoa(JSON.stringify({ email, role: ROLES.USER, timestamp: Date.now() }))
        
        localStorage.setItem("webiu_user", JSON.stringify(userData))
        localStorage.setItem("webiu_token", token)
        
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      } else {
        return { 
          success: false, 
          error: "Invalid credentials. Try admin@example.com/admin123 or user@example.com/user123" 
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("webiu_user")
    localStorage.removeItem("webiu_token")
    setUser(null)
    setIsAuthenticated(false)
  }

  const hasRole = (requiredRole) => {
    if (!user) return false
    if (requiredRole === ROLES.GUEST) return true
    if (user.role === ROLES.ADMIN) return true
    return user.role === requiredRole
  }

  const hasPermission = (permission) => {
    if (!user) return false
    if (user.role === ROLES.ADMIN) return true
    return user.permissions?.includes(permission) || false
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
