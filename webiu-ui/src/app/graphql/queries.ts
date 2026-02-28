import { gql } from 'apollo-angular';

export const GET_PROJECTS = gql`
  query GetProjects($page: Int, $limit: Int) {
    repositories(page: $page, limit: $limit) {
      name
      description
      html_url
      language
      stargazers_count
      forks_count
      pull_requests
    }
  }
`;

export const GET_PROJECT_BY_ID = gql`
  query GetProjectById($id: String!) {
    projectById(id: $id) {
      name
      description
      html_url
      language
      stargazers_count
      forks_count
      pull_requests
    }
  }
`;

export const GET_CONTRIBUTORS = gql`
  query GetContributors($page: Int, $limit: Int) {
    contributors(page: $page, limit: $limit) {
      login
      contributions
      avatar_url
      repos
    }
  }
`;

export const GET_CONTRIBUTOR_BY_USERNAME = gql`
  query GetContributorByUsername($username: String!) {
    contributorByUsername(username: $username) {
      login
      contributions
      avatar_url
      repos
    }
  }
`;
