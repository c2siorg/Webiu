require('dotenv').config();
const express = require('express');
const axios = require('axios');

const router = express.Router();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://api.github.com';
const ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const ORG_NAME = 'c2siorg';

const axiosConfig = {
  headers: {
    Authorization: `token ${ACCESS_TOKEN}`,
  },
};

const fetchFromGitHub = async (url) => {
  try {
    const response = await axios.get(url, axiosConfig);
    return response.data;
  } catch (error) {
    console.error(`GitHub API Error: ${url}`, error.response ? error.response.data : error.message);
    return null;
  }
};

const fetchRepositories = () => fetchFromGitHub(`${BASE_URL}/orgs/${ORG_NAME}/repos`);

const fetchContributors = (repoName) => fetchFromGitHub(`${BASE_URL}/repos/${ORG_NAME}/${repoName}/contributors`);

const fetchUserDetails = (username) => fetchFromGitHub(`${BASE_URL}/users/${username}`);

const fetchUserCreatedIssues = (username) =>
  fetchFromGitHub(`${BASE_URL}/search/issues?q=author:${username}+org:${ORG_NAME}+type:issue`);

const fetchUserCreatedPullRequests = (username) =>
  fetchFromGitHub(`${BASE_URL}/search/issues?q=author:${username}+org:${ORG_NAME}+type:pr`);

const getAllContributors = async (req, res) => {
  try {
    const repositories = await fetchRepositories();
    if (!repositories) return res.status(500).json({ error: 'Failed to fetch repositories' });

    const contributorsMap = {};

    await Promise.all(
      repositories.map(async (repo) => {
        const contributors = await fetchContributors(repo.name);
        if (!contributors) return;

        await Promise.all(
          contributors.map(async (contributor) => {
            const username = contributor.login;
            if (contributorsMap[username]) {
              contributorsMap[username].contributions += contributor.contributions;
              if (!contributorsMap[username].repos.includes(repo.name)) {
                contributorsMap[username].repos.push(repo.name);
              }
              return;
            }

            const userDetails = await fetchUserDetails(username);
            const issues = await fetchUserCreatedIssues(username) || [];
            const pullRequests = await fetchUserCreatedPullRequests(username) || [];

            if (userDetails) {
              contributorsMap[username] = {
                login: username,
                contributions: contributor.contributions,
                repos: [repo.name],
                followers: userDetails.followers,
                following: userDetails.following,
                avatar_url: userDetails.avatar_url,
                issues,
                pullRequests,
              };
            }
          })
        );
      })
    );
    const contributorsList = Object.values(contributorsMap);
    console.log("🔹 API Response:", JSON.stringify(contributorsList, null, 2)); 
    return res.json(contributorsList);

  } catch (error) {
    console.error('Error fetching organization info:', error);
    return res.status(500).json({ error: 'Failed to fetch organization info' });
  }
};

const userCreatedIssues = async (req, res) => {
  const { username } = req.params;
  const issues = await fetchUserCreatedIssues(username);
  return issues
    ? res.status(200).json({ issues })
    : res.status(500).json({ error: 'Failed to fetch user-created issues' });
};

const userCreatedPullRequests = async (req, res) => {
  const { username } = req.params;
  const pullRequests = await fetchUserCreatedPullRequests(username);
  return pullRequests
    ? res.status(200).json({ pullRequests })
    : res.status(500).json({ error: 'Failed to fetch user-created pull requests' });
};

module.exports = { getAllContributors, userCreatedIssues, userCreatedPullRequests };
