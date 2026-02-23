module.exports = {
    apps: [
        {
            name: 'nextjs-app',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'telegram-bot',
            script: 'node_modules/tsx/dist/cli.mjs',
            args: 'scripts/bot.ts',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
