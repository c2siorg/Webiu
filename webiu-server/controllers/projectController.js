//controllers/projectController.js

const axios = require('axios');
const accessToken = process.env.GITHUB_ACCESS_TOKEN;

const getAllProjects = async (req, res, next) => {
  try {
    // Fetch repositories
    const repositoriesResponse = await axios.get(
      `https://api.github.com/orgs/c2siorg/repos`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    const repositories = repositoriesResponse.data;

    const repositoriesWithPRs = await Promise.all(
      repositories.map(async (repo) => {
        const pullsResponse = await axios.get(
          `https://api.github.com/repos/c2siorg/${repo.name}/pulls`,
          {
            headers: {
              Authorization: `token ${accessToken}`,
            },
          }
        );
        return {
          ...repo,
          pull_requests: pullsResponse.data.length,
        };
      })
    );

    res.status(200).json({ repositories: repositoriesWithPRs });
  } catch (error) {
    console.error(
      'Error fetching repositories or pull requests:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllProjects };
