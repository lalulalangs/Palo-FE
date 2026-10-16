module.exports = {
  apps: [
    {
      name: 'palorinjani-frontend',
      cwd: '/srv/palorinjani/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'fork',
    },
  ],
};
