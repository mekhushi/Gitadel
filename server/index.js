const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const simpleGit = require('simple-git');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// The path to the repository we want to visualize
// Defaulting to the parent directory (Gitadel) which we will turn into a git repo for testing
const repoPath = path.join(__dirname, '..');
const git = simpleGit(repoPath);

async function getRepoData() {
    try {
        const branches = await git.branch();
        const logs = await git.log(['--numstat']);
        
        // Process logs to include lines added/deleted
        const processedLogs = logs.all.map(log => {
            // simple-git's --numstat parsing can be tricky, let's just get the raw details if needed
            // but simple-git actually parses some of it.
            return {
                hash: log.hash,
                date: log.date,
                message: log.message,
                author_name: log.author_name,
                // We'll calculate a 'size' based on impact later
            };
        });

        return {
            currentBranch: branches.current,
            branches: branches.all,
            commits: processedLogs
        };
    } catch (err) {
        console.error("Error fetching git data:", err);
        return { error: err.message };
    }
}

io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('get-repo-data', async () => {
        const data = await getRepoData();
        socket.emit('repo-data', data);
    });

    socket.on('merge', async ({ source, target }) => {
        try {
            await git.checkout(target);
            const result = await git.merge([source]);
            socket.emit('merge-result', { success: true, result });
        } catch (err) {
            if (err.message.includes('CONFLICT')) {
                // Get conflict details
                const status = await git.status();
                const conflicts = status.conflicted;
                socket.emit('merge-result', { success: false, conflict: true, files: conflicts });
            } else {
                socket.emit('merge-result', { success: false, error: err.message });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Git-Command-Center Server running on port ${PORT}`);
});
