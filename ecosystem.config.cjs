module.exports = {
  apps: [{
    name: "charbon",
    cwd: "/root/webinde",
    script: "bash",
    args: ["-c", "export PORT=3000 && flox activate pnpm dev -- --port 3000"],
    env: {
      PORT: 3000
    },
    autorestart: true,
    watch: false
  }]
};
