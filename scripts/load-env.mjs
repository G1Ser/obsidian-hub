import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// env 加载：.env.example 为基础，.env 覆盖
// ---------------------------------------------------------------------------

const parseEnvFile = filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([^=#]+?)\s*=\s*(.+?)\s*$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {
    /* 文件不存在，跳过 */
  }
};

export const loadEnv = () => {
  parseEnvFile(path.join(ROOT, '.env.example'));
  parseEnvFile(path.join(ROOT, '.env'));
};

// ---------------------------------------------------------------------------
// vault 部署
// ---------------------------------------------------------------------------

/**
 * 将 outDir 下所有文件拷贝到 vault 的插件目录。
 * @param {string} pluginId - 插件 ID
 * @param {string} outDir   - 构建产物目录
 */
export const deployToVault = (pluginId, outDir) => {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) return;

  const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', pluginId);
  try {
    fs.mkdirSync(pluginDir, { recursive: true });
    for (const file of fs.readdirSync(outDir)) {
      fs.copyFileSync(path.join(outDir, file), path.join(pluginDir, file));
    }
    console.log(`Deployed to ${pluginDir}`);
  } catch (e) {
    console.error(`Failed to deploy to vault: ${e.message}`);
  }
};
