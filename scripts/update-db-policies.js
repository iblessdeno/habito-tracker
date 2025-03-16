// This script calls the init-db API route to update database policies
const { execSync } = require('child_process');

console.log('Calling init-db API route to update database policies...');

try {
  // Get the URL from the environment or use localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/init-db`;
  
  // Use curl to call the API
  const command = `curl -X GET ${apiUrl}`;
  const output = execSync(command, { encoding: 'utf8' });
  
  console.log('Response:', output);
  console.log('Database policies updated successfully!');
} catch (error) {
  console.error('Error updating database policies:', error.message);
  process.exit(1);
}
