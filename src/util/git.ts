import { execSync } from 'child_process';
import path from 'path';

export function ensureGitInstalled(): void {
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch {
    throw new Error('git is required but not installed. Install git and try again.');
  }
}

export function cloneRepository(gitUrl: string, targetDir: string): void {
  execSync(`git clone --depth 1 "${gitUrl}" "${targetDir}"`, { stdio: 'pipe' });
}

export function pullRepository(repoDir: string): void {
  execSync('git pull', { cwd: repoDir, stdio: 'pipe' });
}

export function isGitRepository(dir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Derive a filesystem-safe cache key from a git URL.
 *  GitHub https://github.com/owner/repo → owner/repo
 *  SSH    git@github.com:owner/repo.git → owner/repo
 *  Other  → sanitized URL string
 */
export function urlToCacheKey(gitUrl: string): string {
  const githubHttps = gitUrl.match(/github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/);
  if (githubHttps) return `${githubHttps[1]}/${githubHttps[2]}`;

  const githubSsh = gitUrl.match(/git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (githubSsh) return `${githubSsh[1]}/${githubSsh[2]}`;

  return gitUrl.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

export function cacheDirForUrl(baseDir: string, gitUrl: string): string {
  return path.join(baseDir, urlToCacheKey(gitUrl));
}
