require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
const port = process.env.PORT || 3000;
const baseUrl = 'https://api.github.com';
const accessToken = process.env.GITHUB_ACCESS_TOKEN;
const GitHub = require('gh.js');

const getAllContributors = async (req, res) => {
  try {
    const orgName = 'c2siorg';
    const contributorsMap = new Map();

    const repositories = await fetchRepositories(orgName);
    if (!repositories?.length) {
      return res.status(404).json({ error: 'No repositories found' });
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
      const batch = repositories.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (repo) => {
          try {
            const contributors = await fetchContributors(orgName, repo.name);
            if (!contributors?.length) return;

            contributors.forEach((contributor) => {
              const login = contributor.login;

              if (!contributorsMap.has(login)) {
                contributorsMap.set(login, {
                  login,
                  contributions: contributor.contributions,
                  repos: new Set([repo.name]),
                  avatar_url: contributor.avatar_url,
                });
              } else {
                const userData = contributorsMap.get(login);
                userData.contributions += contributor.contributions;
                userData.repos.add(repo.name);
              }
            });
          } catch (err) {
            console.error(`Error processing repo ${repo.name}:`, err);
          }
        })
      );
    }

    const allContributors = Array.from(contributorsMap.values()).map(
      (contributor) => ({
        ...contributor,
        repos: Array.from(contributor.repos),
      })
    );

    res.set('Cache-Control', 'public, max-age=300');
    return res.json(allContributors);
  } catch (error) {
    console.error('Error in getAllContributors:', error);
    return res.status(500).json({
      error: 'Failed to fetch organization info',
      message: error.message,
    });
  }
};

async function fetchUserCreatedIssues(username) {
  try {
    const issuesResponse = await axios.get(
      `${baseUrl}/search/issues?q=author:${username}+org:c2siorg+type:issue`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return issuesResponse.data.items || [];
  } catch (error) {
    console.error('Error fetching user-created issues:', error);
    return [];
  }
}

async function fetchUserCreatedPullRequests(username) {
  try {
    const pullRequestsResponse = await axios.get(
      `${baseUrl}/search/issues?q=author:${username}+org:c2siorg+type:pr`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return pullRequestsResponse.data.items || [];
  } catch (error) {
    console.error('Error fetching user-created pull requests:', error);
    return [];
  }
}

async function fetchRepositories(orgName) {
  try {
    const response = await axios.get(`${baseUrl}/orgs/${orgName}/repos`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in fetching repositories', error);
    return null;
  }
}

async function fetchContributors(orgName, repoName) {
  try {
    const response = await axios.get(
      `${baseUrl}/repos/${orgName}/${repoName}/contributors`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in fetching contributors', error);
    return null;
  }
}

async function fetchUserDetails(username) {
  try {
    const response = await axios.get(`${baseUrl}/users/${username}`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    return {
      login: response.data.login,
      contributions: response.data.contributions,
      followers: response.data.followers,
      following: response.data.following,
      avatar_url: response.data.avatar_url,
    };
  } catch (error) {
    console.error('Error in fetching contributor details', error);
    return null;
  }
}

const userCreatedIssues = async (req, res) => {
  try {
    const orgName = 'c2siorg';
    const { username } = req.params;

    const issuesResponse = await axios.get(
      `${baseUrl}/search/issues?q=author:${username}+org:${orgName}+type:issue`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    const issues = issuesResponse.data.items;

    if (!issues) {
      return res
        .status(500)
        .json({ error: 'Failed to fetch user-created issues' });
    }

    return res.status(200).json({ issues });
  } catch (error) {
    console.error(
      'Error fetching user created issues:',
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const userCreatedPullRequests = async (req, res) => {
  try {
    const orgName = 'c2siorg';
    const { username } = req.params;

    const pullRequestsResponse = await axios.get(
      `${baseUrl}/search/issues?q=author:${username}+org:${orgName}+type:pr`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    const pullRequests = pullRequestsResponse.data.items;

    if (!pullRequests) {
      return res
        .status(500)
        .json({ error: 'Failed to fetch user-created pull requests' });
    }

    return res.status(200).json({ pullRequests });
  } catch (error) {
    console.error(
      'Error fetching user created pull requests:',
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getUserFollowersAndFollowing(req, res) {
  const username = req.params.username;

  return res.status(200).json({ 0: 0 });
  // const gh = new GitHub({
  //   token: accessToken,
  // });

  // if (!username) {
  //   return res.status(400).json({ error: 'Username is required' });
  // }

  // try {
  //   const [followers, following] = await Promise.all([
  //     new Promise((resolve, reject) => {
  //       gh.get(`users/${username}/followers`, { all: true }, (err, data) => {
  //         if (err) reject(err);
  //         else resolve(data.length || 0);
  //       });
  //     }),
  //     new Promise((resolve, reject) => {
  //       gh.get(`users/${username}/following`, { all: true }, (err, data) => {
  //         if (err) reject(err);
  //         else resolve(data.length || 0);
  //       });
  //     }),
  //   ]);

  //   res.json({ followers, following });
  // } catch (error) {
  //   console.error(`Error fetching GitHub data for ${username}:`, error.message);
  //   res.status(500).json({ error: 'Failed to fetch data from GitHub' });
  // }
}

module.exports = {
  getAllContributors,
  userCreatedIssues,
  userCreatedPullRequests,
  getUserFollowersAndFollowing,
};
