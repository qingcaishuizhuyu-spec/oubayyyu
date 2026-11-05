import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  // GitHub Actions 中自动使用仓库子路径，本地开发仍使用根路径。
  base:
    process.env.GITHUB_ACTIONS && repositoryName
      ? `/${repositoryName}/`
      : '/',
  plugins: [react()],
})
