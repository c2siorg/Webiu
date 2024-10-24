require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
const port = process.env.PORT || 3000;
const baseUrl = 'https://api.github.com';
const accessToken = process.env.GITHUB_ACCESS_TOKEN;



const getAllContributors = async (req, res) => {
  try {
    let finalResponse = {};
    const orgName = 'c2siorg';
    const repositories = await fetchRepositories(orgName);

    if (!repositories) {
      return res.status(500).json({ error: 'Failed to fetch repositories' });
    }

    await Promise.all(
      repositories.map(async (repo) => {
        const contributors = await fetchContributors(orgName, repo.name);

        if (!contributors) {
          return;
        }

        await Promise.all(
          contributors.map(async (contributor) => {
            const userDetails = await fetchUserDetails(contributor.login);

            if (!userDetails) {
              return;
            }

            // Fetch user-created issues and pull requests
            const issues = await userCreatedIssues(contributor.login);
            const pullRequests = await userCreatedPullRequests(contributor.login);

            if (finalResponse[userDetails.login]) {
              finalResponse[userDetails.login].repos.push(repo.name);
              finalResponse[userDetails.login].issues.push(...issues);
              finalResponse[userDetails.login].pullRequests.push(...pullRequests);
            } else {
              finalResponse[userDetails.login] = {
                login: userDetails.login,
                contributions: contributor.contributions,
                repos: [repo.name],
                followers: userDetails.followers,
                following: userDetails.following,
                avatar_url: userDetails.avatar_url,
                issues: issues,
                pullRequests: pullRequests,
              };
            }
          })
        );
      })
    );

    let allContributors = Object.values(finalResponse);
    return res.json(allContributors);
  } catch (error) {
    console.error('Error fetching organization info:', error);
    return res.status(500).json({ error: 'Failed to fetch organization info' });
  }
};

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
    const response = await axios.get(`${baseUrl}/repos/${orgName}/${repoName}/contributors`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
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
      followers: response.data.followers,
      following: response.data.following,
      avatar_url: response.data.avatar_url,
    };
  } catch (error) {
    console.error('Error in fetching contributor details', error);
    return null;
  }
}

// Fetch user-created issues
const userCreatedIssues = async (username) => {
  try {
    const issuesResponse = await axios.get(
      `https://api.github.com/search/issues?q=author:${username}+org:c2si+type:issue`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return issuesResponse.data.items;
  } catch (error) {
    console.error('Error fetching user created issues:', error.response ? error.response.data : error.message);
    return [];
  }
};

// Fetch user-created pull requests
const userCreatedPullRequests = async (username) => {
  try {
    const pullRequestsResponse = await axios.get(
      `https://api.github.com/search/issues?q=author:${username}+org:c2si+type:pr`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return pullRequestsResponse.data.items;
  } catch (error) {
    console.error('Error fetching user created pull requests:', error.response ? error.response.data : error.message);
    return [];
  }
};



module.exports = {
  getAllContributors,
  userCreatedIssues, 
  userCreatedPullRequests 
};
