const axios = require('axios');

const accessToken =
  process.env.GITHUB_ACCESS_TOKEN || (process.env.NODE_ENV === 'test' && 'test-token');

if (!accessToken) {
  throw new Error("GITHUB_ACCESS_TOKEN is not defined in the environment.");
}

const GITHUB_API_URL = 'https://api.github.com';
const headers = {
  Authorization: `token ${accessToken}`,
};

const getAllProjects = async (req, res) => {
  try {
    const repositoriesResponse = await axios.get(`${GITHUB_API_URL}/orgs/c2siorg/repos`, {
      headers,
    });

    const repositories = repositoriesResponse.data;
    const repositoriesWithPRs = await Promise.allSettled(
      repositories.map(async (repo) => {
        try {
          const pullsResponse = await axios.get(
            `${GITHUB_API_URL}/repos/c2siorg/${repo.name}/pulls`,
            { headers }
          );

          return {
            name: repo.name,
            description: repo.description || 'No description provided',
            open_issues_count: repo.open_issues_count || 0,
            stargazers_count: repo.stargazers_count || 0,
            pull_requests: pullsResponse.data.length,
          };
        } catch (err) {
          console.error(`Error fetching pull requests for ${repo.name}:`, err.message);
          return {
            name: repo.name,
            description: repo.description || 'No description available',
            open_issues_count: repo.open_issues_count || 0,
            stargazers_count: repo.stargazers_count || 0,
            pull_requests: 'Error fetching PRs',
          };
        }
      })
    );

    const successfulProjects = repositoriesWithPRs
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
    const failedProjects = repositoriesWithPRs
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);

    if (failedProjects.length) {
      console.warn(`Some repositories could not be processed:`, failedProjects);
    }

    res.status(200).json({ repositories: successfulProjects });
  } catch (error) {
    console.error(
      'Error fetching repositories or pull requests:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllProjects };
