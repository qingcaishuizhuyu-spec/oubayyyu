# 生日网站

网站采用全黑背景，包含滚动式蛋糕选择、蛋糕马赛克首屏、信封与可拖拽纸团、三张人像 CD 画廊和独立视频播放器。纸团效果使用 Three.js。

## 开始使用

```bash
npm install
npm run dev
```

浏览器访问终端输出的本地地址（通常是 `http://localhost:5173`）。

## GitHub Pages 发布

项目推送至 GitHub `main` 分支后，工作流会自动构建并发布到 GitHub Pages。发布地址通常为：

```text
https://<GitHub 用户名>.github.io/<仓库名>/
```

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生成生产构建
npm run preview  # 本地预览生产构建
```

## 目录约定

```text
public/
├── images/       # 图片素材
├── audio/        # 音频素材
├── videos/       # 视频素材
└── fonts/        # 字体文件

src/
├── assets/       # 需要经过 Vite 处理的静态素材
├── components/   # 可复用组件
├── hooks/        # 自定义 React Hooks
├── pages/        # 页面或场景
├── styles/       # 全局样式与设计变量
├── utils/        # 资源路径和通用工具
├── App.jsx
└── main.jsx
```

## 后续扩展

- 新页面或完整场景放在 `src/pages/`。
- 可复用 UI 和交互控件放在 `src/components/`。
- 需要打包优化的图片放在 `src/assets/`，通过 `import` 引入。
- 需要保持固定公开路径的图片、音频和字体放在 `public/` 对应目录。
- 所有公开素材路径统一登记在 `src/utils/assets.js`，不要把路径字符串分散到组件中。
- 场景通过 `App.jsx` 中的 `scenes` 配置登记；页面内状态留在对应页面组件中。
- 基础状态切换优先使用 CSS transition/animation；复杂动画封装在独立组件或 Hook 中。
