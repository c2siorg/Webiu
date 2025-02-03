const axios = require('axios');
const accessToken = process.env.GITHUB_ACCESS_TOKEN;

const getAllProjects = async (req, res, next) => {
  try {
    
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

const getIssuesAndPr = async (req, res) => {
  const { org, repo } = req.query;

  if (!org || !repo) {
    return res.status(400).json({ error: 'Organization and repository are required' });
  }

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${org}/${repo}/issues`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    const issues = response.data.filter((item) => !item.pull_request).length;
    const pullRequests = response.data.filter((item) => item.pull_request).length;

    res.status(200).json({ issues, pullRequests });
  } catch (error) {
    console.error('Error fetching issues and PRs:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch issues and PRs' });
  }
}

module.exports = { getAllProjects, getIssuesAndPr };
