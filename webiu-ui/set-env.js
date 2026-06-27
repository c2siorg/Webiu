const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
const apiUrl = process.env.API_URL || 'https://api.c2si.org';

const envConfigFile = `export const environment = {
  production: true,
  serverUrl: '${apiUrl.replace(/\/$/, '')}',
};
`;

fs.writeFileSync(targetPath, envConfigFile, 'utf8');
console.log(`[set-env] Updated environment.prod.ts with API_URL: ${apiUrl}`);
