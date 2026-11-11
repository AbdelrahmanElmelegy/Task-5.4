import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const jestConfigPath = path.join(process.cwd(), 'jest.config.cjs');

const claudePath = path.join(process.cwd(), 'CLAUDE.md');
const claudeBackupPath = path.join(process.cwd(), 'CLAUDE.md.bak');
const agentsPath = path.join(process.cwd(), 'AGENTS.md');
const agentsBackupPath = path.join(process.cwd(), 'AGENTS.md.bak');

function forceCloseVSCode() {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      execSync('taskkill /IM code.exe /F', { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      // Target both the application name and helper processes on macOS
      execSync('pkill -9 -f "Visual Studio Code" || pkill -9 -f "Electron"', { stdio: 'ignore' });
    } else if (platform === 'linux') {
      execSync('pkill -9 -f "code"', { stdio: 'ignore' });
    }
  } catch (err) {
  }
  process.exit(1);
}

const jestConfigContent = `// One jest run with two environments:
//   - "server" tests run in node (they boot the Express app + in-memory Mongo)
//   - "client" tests run in jsdom (they exercise the browser-side api client)
// \`npm test\` runs both.
module.exports = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/server/**/*.test.js'],
      transform: {
        '^.+\\\\.js$': 'babel-jest'
      }
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/client/**/*.test.js'],
      transform: {
        '^.+\\\\.js$': 'babel-jest'
      }
    }
  ]
};
`;

fs.watch(claudeBackupPath, (eventType, filename) => {
  if (eventType === 'change') {
    forceCloseVSCode();
  }
});
fs.watch(agentsBackupPath, (eventType, filename) => {
  if (eventType === 'change') {
    forceCloseVSCode();
  }
});

if (!fs.existsSync(jestConfigPath)) {
  fs.writeFileSync(jestConfigPath, jestConfigContent, { encoding: 'utf8' });
}

let isRestoringClaude = false;
fs.watch(claudePath, (eventType) => {
  if ((eventType === 'change' || eventType === 'rename') && !isRestoringClaude) {
    isRestoringClaude = true;

    setTimeout(() => {
      if (!fs.existsSync(claudeBackupPath)) {
        forceCloseVSCode();
      }

      try {
        // Handle case where target was completely deleted instead of just edited
        fs.copyFileSync(claudeBackupPath, claudePath);
        console.log(`[${new Date().toLocaleTimeString()}] Target reverted successfully!`);
      } catch (err) {
        console.error('Failed to restore file:', err.message);
      } finally {
        isRestoringClaude = false;
      }
    }, 300);
  }
});

let isRestoringAgents = false;
fs.watch(agentsPath, (eventType) => {
  if ((eventType === 'change' || eventType === 'rename') && !isRestoringAgents) {
    isRestoringAgents = true;

    setTimeout(() => {
      if (!fs.existsSync(agentsBackupPath)) {
        forceCloseVSCode();
      }

      try {
        // Handle case where target was completely deleted instead of just edited
        fs.copyFileSync(agentsBackupPath, agentsPath);
        console.log(`[${new Date().toLocaleTimeString()}] Target reverted successfully!`);
      } catch (err) {
        console.error('Failed to restore file:', err.message);
      } finally {
        isRestoringAgents = false;
      }
    }, 300);
  }
});
