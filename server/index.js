const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const simpleGit = require('simple-git');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Current working repository
let currentRepoPath = null;
let git = null;

async function getRepoData() {
    if (!git) return { error: "No repository selected" };
    try {
        const branches = await git.branch();
        const logs = await git.log(['-n', '20', '--stat']);
        
        const processedLogs = logs.all.map(log => {
            return {
                hash: log.hash,
                date: log.date,
                message: log.message,
                author_name: log.author_name,
                // simple-git's stat parsing might be limited, but let's try
                diff: log.diff || { changes: 0, insertions: 0, deletions: 0 }
            };
        });

        return {
            currentBranch: branches.current,
            branches: branches.all,
            commits: processedLogs,
            repoPath: currentRepoPath
        };
    } catch (err) {
        console.error("Error fetching git data:", err);
        return { error: err.message };
    }
}

io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('set-repo-path', async (newPath) => {
        try {
            let targetPath = newPath;

            // Detect if it's a URL
            if (newPath.startsWith('http') || newPath.startsWith('git@')) {
                socket.emit('repo-status', "INITIALIZING CLONE SEQUENCE...");
                
                const repoName = newPath.split('/').filter(Boolean).pop().replace('.git', '');
                const clonedReposDir = path.join(__dirname, 'cloned_repos');
                await fs.mkdir(clonedReposDir, { recursive: true });
                targetPath = path.join(clonedReposDir, repoName);

                try {
                    await fs.access(targetPath);
                    socket.emit('repo-status', "USING LOCAL CACHE...");
                } catch {
                    socket.emit('repo-status', `CLONING ${repoName.toUpperCase()}...`);
                    const tempGit = simpleGit();
                    await tempGit.clone(newPath, targetPath);
                }
            }
            socket.emit('repo-status', "INDEXING TERRITORY...");

            // Check if path exists and is a git repo
            const stats = await fs.stat(targetPath);
            if (!stats.isDirectory()) {
                socket.emit('repo-error', "Path is not a directory");
                return;
            }

            const gitDir = path.join(targetPath, '.git');
            await fs.stat(gitDir);
            
            currentRepoPath = targetPath;
            git = simpleGit(currentRepoPath);
            
            console.log(`Repository set to: ${currentRepoPath}`);
            const data = await getRepoData();
            socket.emit('repo-data', data);
        } catch (err) {
            console.error("Error setting repo path:", err);
            socket.emit('repo-error', "Invalid Git repository or URL");
        }
    });

    socket.on('get-repo-data', async () => {
        const data = await getRepoData();
        socket.emit('repo-data', data);
    });

    socket.on('checkout', async (branch) => {
        if (!git) return;
        try {
            console.log(`Checking out ${branch}`);
            await git.checkout(branch);
            const data = await getRepoData();
            socket.emit('repo-data', data);
        } catch (err) {
            socket.emit('repo-error', `Checkout failed: ${err.message}`);
        }
    });

    socket.on('merge', async ({ source, target }) => {
        if (!git) return;
        try {
            console.log(`Merging ${source} into ${target}`);
            await git.checkout(target);
            const result = await git.merge([source]);
            socket.emit('merge-result', { success: true, result });
            
            const data = await getRepoData();
            socket.emit('repo-data', data);
        } catch (err) {
            console.log("Merge error:", err.message);
            if (err.message.includes('CONFLICT')) {
                const status = await git.status();
                const conflictedFiles = status.conflicted;
                
                const conflictData = await Promise.all(conflictedFiles.map(async (file) => {
                    const content = await fs.readFile(path.join(currentRepoPath, file), 'utf8');
                    return { file, content };
                }));

                socket.emit('merge-result', { success: false, conflict: true, files: conflictData });
            } else {
                socket.emit('merge-result', { success: false, error: err.message });
            }
        }
    });

    socket.on('resolve-conflict', async ({ file, content }) => {
        if (!git) return;
        try {
            console.log(`Resolving conflict in ${file}`);
            await fs.writeFile(path.join(currentRepoPath, file), content);
            await git.add(file);
            
            const status = await git.status();
            if (status.conflicted.length === 0) {
                await git.commit('Merge conflict resolved via Gitadel Command Center');
                socket.emit('merge-result', { success: true });
            }
            
            const data = await getRepoData();
            socket.emit('repo-data', data);
        } catch (err) {
            console.error("Resolution error:", err);
            socket.emit('merge-result', { success: false, error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Gitadel Server running on port ${PORT}`);
});
