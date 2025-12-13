import { spawn } from 'node:child_process';
import path from 'node:path';

export interface QWormholeBenchResult {
  id: string;
  serverMode: string;
  clientMode: string;
  durationMs: number;
  messagesReceived: number;
  bytesReceived: number;
  msgsPerSec: number;
  mbPerSec: number;
  framing?: string;
  skipped?: boolean;
  reason?: string;
  diagnostics?: Record<string, unknown>;
}

export interface QWormholeBenchSummary {
  scenarios: QWormholeBenchResult[];
  rawOutput: string;
}

/**
 * Run QWormhole's bench harness (diagnostics mode) and return parsed JSON.
 * It spawns the upstream @gsknnft/qwormhole bench script, so it assumes the workspace link exists.
 */
export async function runQWormholeBench(mode: string = 'all'): Promise<QWormholeBenchSummary> {
  const cwd = path.resolve(process.cwd(), '../sigilnet/packages/QWormhole');
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['run', 'bench', '--', `--mode=${mode}`, '--diagnostics'],
      { cwd, shell: true },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`bench exited with code ${code}: ${stderr}`));
        return;
      }
      // Bench script prints JSON array; grab last JSON-looking block
      const jsonMatch = stdout.match(/\[\s*{[\s\S]*}\s*]/);
      if (!jsonMatch) {
        resolve({ scenarios: [], rawOutput: stdout });
        return;
      }
      try {
        const parsed = JSON.parse(jsonMatch[0]) as QWormholeBenchResult[];
        resolve({ scenarios: parsed, rawOutput: stdout });
      } catch (err) {
        resolve({ scenarios: [], rawOutput: stdout });
      }
    });
  });
}
