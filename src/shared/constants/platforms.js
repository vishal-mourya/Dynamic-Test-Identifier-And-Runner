/**
 * Platform Constants
 * Defines supported Git platforms and their configuration
 */

export const PLATFORMS = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  BITBUCKET: 'bitbucket',
  UNKNOWN: 'unknown'
};

export const PLATFORM_CONFIG = {
  [PLATFORMS.GITHUB]: {
    name: 'GitHub',
    hostname: 'github.com',
    apiUrl: 'https://api.github.com',
    urlPattern: /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
    requiredScopes: ['repo', 'read:org']
  },
  [PLATFORMS.GITLAB]: {
    name: 'GitLab',
    hostname: 'gitlab.com',
    apiUrl: 'https://gitlab.com/api/v4',
    urlPattern: /gitlab\.com\/([^/]+)\/([^/]+)\/-\/merge_requests\/(\d+)/,
    requiredScopes: ['api', 'read_repository']
  },
  [PLATFORMS.BITBUCKET]: {
    name: 'Bitbucket',
    hostname: 'bitbucket.org',
    apiUrl: 'https://api.bitbucket.org/2.0',
    urlPattern: /bitbucket\.org\/([^/]+)\/([^/]+)\/pull-requests\/(\d+)/,
    requiredScopes: ['repository:read', 'pullrequest:read']
  }
};

export const URL_PATTERNS = {
  [PLATFORMS.GITHUB]: [
    'https://github.com/*/pull/*'
  ],
  [PLATFORMS.GITLAB]: [
    'https://gitlab.com/*/merge_requests/*',
    'https://gitlab.com/*/-/merge_requests/*'
  ],
  [PLATFORMS.BITBUCKET]: [
    'https://bitbucket.org/*/pull-requests/*'
  ]
};
