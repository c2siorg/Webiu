# WebiU 2.0: C2SI/SCoRe Lab Website

<p>
  <img width="400" height="auto" src="https://github.com/Grumpyyash/Webiu/blob/master/static/images/logo.png">
</p>

## Project Summary

WebiU 2.0 is a web application designed to provide a visually appealing and intuitive interface specifically for C2SI and SCoRe Lab. The website offers a comprehensive view of various projects, showcasing detailed information such as the tech stack, issue count, contributors, forks, and stars. Additionally, the site highlights individual contributions of each contributor, enhancing the visibility of their efforts.

The project leverages the GitHub API for retrieving project details and integrates databases for efficient data management. Comprehensive documentation is provided to assist future contributors, ensuring the project remains accessible and understandable.

## Features

- **Project Information Display**: Showcases detailed information about each project, including tech stack, issue count, contributors, forks, and stars.
- **Individual Contributor Highlight**: Displays contributions made by each contributor, emphasizing their role and impact on the project.
- **GitHub API Integration**: Retrieves project data directly from GitHub, ensuring real-time updates.
- **Comprehensive Documentation**: Guides future contributors on how to get started, contribute, and understand the project's architecture.

## Future Goals

- **User Authentication**: Implementing a system that allows users to log in and view their personalized contribution details.
- **Admin Functionality**: Developing features that allow admins to manage the visibility of projects on the website.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Project Structure](#project-structure)
4. [APIs and Integrations](#apis-and-integrations)
5. [Future Goals](#future-goals)
6. [Contributing](#contributing)
7. [License](#license)

## Installation

### Prerequisites

- **Node.js** (v18.x.x or higher)
- **npm** (v9.x.x or higher)
- **Angular CLI** (v17.x.x)
- **MongoDB** (for database)
- **Git** (for version control)

### Frontend Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd webiu-ui
   ```

2. **Install Angular CLI globally:**

   ```bash
   npm install -g @angular/cli
   ```

3. **Install project dependencies:**

   ```bash
   npm install
   ```

4. **Run the frontend development server:**

   ```bash
   ng serve
   ```

   The frontend should now be running on `http://localhost:4200`.

### Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd webiu-server
   ```

2. **Create a `.env` file:**

   ```plaintext
   PORT=5000
   GITHUB_ACCESS_TOKEN=your_github_token
   ```

3. **Install project dependencies:**

   ```bash
   npm install
   ```

4. **Start the backend server:**

   ```bash
   npm start
   ```

   The backend should now be running on `http://localhost:5000`.

### Running with Docker

1. **Ensure Docker is installed.**

2. **Build and start the Docker containers:**

   ```bash
   docker-compose up --build
   ```

3. **Access the services:**

   - Frontend: `http://localhost:4200`
   - Backend: `http://localhost:5000`

## Project Structure

```plaintext
webiu/
├── webiu-ui/        # Frontend (Angular 17)
└── webiu-server/    # Backend (Node.js and Express)
```

- **webiu-ui**: Contains the frontend code built with Angular 17.
- **webiu-server**: Contains the backend code using Node.js and Express.

## APIs and Integrations

- **GitHub API**: Used for fetching real-time data such as project details, issue counts, contributors, forks, and stars.
- **Database Integration**: MongoDB is used to store project and contributor data efficiently.

## Future Goals

- **User Authentication**: Implementing a system that allows users to log in and view their personalized contribution details.
- **Admin Functionality**: Developing features that allow admins to manage the visibility of projects on the website.

## Contributing

We welcome contributions! Please refer to our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get started, make changes, and submit your work.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
