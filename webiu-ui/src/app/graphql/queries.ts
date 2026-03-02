import { gql } from 'apollo-angular';

export const GET_PROJECTS = gql`
  query GetProjects($page: Int, $limit: Int) {
    projects(page: $page, limit: $limit) {
      repositories {
        id
        name
        description
        html_url
        language
        stars
        forks
        topics
        url
        open_issues
        pull_requests
        owner
      }
      total
      page
      limit
    }
  }
`;

export const GET_PROJECT_BY_ID = gql`
  query GetProjectById($id: String!) {
    projectById(id: $id) {
      id
      name
      description
      html_url
      language
      stars
      forks
      topics
      url
      open_issues
      pull_requests
      owner
    }
  }
`;

export const GET_CONTRIBUTORS = gql`
  query GetContributors($page: Int, $limit: Int) {
    contributors(page: $page, limit: $limit) {
      id
      login
      contributions
      avatar_url
      html_url
      repos
    }
  }
`;

export const GET_CONTRIBUTOR_BY_USERNAME = gql`
  query GetContributorByUsername($username: String!) {
    contributorByUsername(username: $username) {
      id
      login
      contributions
      avatar_url
      html_url
      repos
    }
  }
`;
