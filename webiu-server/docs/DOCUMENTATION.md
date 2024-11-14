
# API Documentation for Webiu

## Authentication Endpoints

### 1. **User Registration**

- **Endpoint**: `POST /api/v1/auth/register`
- **Description**: Registers a new user with the provided credentials (name, email, password, confirmPassword, githubId).
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "githubId": "johndoeGitHub"
  }
  ```

- **Validation**:
  - **Email format**: The email must match the valid email pattern (`example@domain.com`).
  - **Password match**: The password and confirmPassword must be identical.

- **Responses**:
  - **201 Created**: On successful registration.
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "data": {
        "user": {
          "id": "userId123",
          "name": "John Doe",
          "email": "johndoe@example.com"
        },
        "token": "JWT_Token_Here"
      }
    }
    ```

  - **400 Bad Request**: If the email format is invalid or passwords do not match.
    ```json
    {
      "status": "error",
      "message": "Invalid email format"
    }
    ```
    OR
    ```json
    {
      "status": "error",
      "message": "Passwords do not match"
    }
    ```

  - **400 Bad Request**: If the user already exists with the given email.
    ```json
    {
      "status": "error",
      "message": "User already exists"
    }
    ```

  - **500 Internal Server Error**: If an unexpected error occurs.
    ```json
    {
      "status": "error",
      "message": "Error message here"
    }
    ```

### 2. **User Login**

- **Endpoint**: `POST /api/v1/auth/login`
- **Description**: Logs in an existing user with the provided email and password.
- **Request Body**:
  ```json
  {
    "email": "johndoe@example.com",
    "password": "password123"
  }
  ```

- **Validation**:
  - **Email format**: The email must match the valid email pattern (`example@domain.com`).

- **Responses**:
  - **200 OK**: On successful login.
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "data": {
        "user": {
          "id": "userId123",
          "name": "John Doe",
          "email": "johndoe@example.com",
          "githubId": "johndoeGitHub"
        },
        "token": "JWT_Token_Here"
      }
    }
    ```

  - **400 Bad Request**: If the email format is invalid.
    ```json
    {
      "status": "error",
      "message": "Invalid email format"
    }
    ```

  - **401 Unauthorized**: If the user does not exist or if the password is incorrect.
    ```json
    {
      "status": "error",
      "message": "Invalid email or password"
    }
    ```

  - **500 Internal Server Error**: If an unexpected error occurs.
    ```json
    {
      "status": "error",
      "message": "Error message here"
    }
    ```



