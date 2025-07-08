module.exports = {
    apps: [
        {
            name: 'cpc-management-server',
            script: 'server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 5001
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5001
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true
        }
    ],

    deploy: {
        production: {
            user: 'node',
            host: 'your-server-ip',
            ref: 'origin/main',
            repo: 'https://github.com/masakinakano-cpc/CPC-Management-site.git',
            path: '/var/www/cpc-management',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': ''
        }
    }
};
