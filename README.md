# MRR Admin

[shadcn-admin](https://github.com/satnaing/shadcn-admin) 风格的 MRR 医疗病案管理前端。此仓库是独立的 **React + TypeScript + Vite** 管理端，依赖既有 [MRR](https://github.com/weepwood/MRR) Spring Boot 后端，不替换或改动原 Vue 管理界面。

> 当前为第一阶段业务界面迁移：真实数据接入，无 Mock 患者、扫描或统计数据。**尚未完成与实际 MRR 数据库的端到端联调。**

## 已实现页面

| 页面 | 路由 | 数据来源 / 权限 |
| --- | --- | --- |
| 登录与首次改密 | `/login`、`/change-password` | `/api/v1/auth/login`、`/me`、`/password/required-change` |
| 工作台总览 | `/` | `/api/v1/statistics/dashboard`、`/api/v1/public/status/summary` |
| 患者档案 | `/patients` | `GET /api/v1/patients`，`record:read` |
| 扫描记录 | `/scans` | `POST /api/v1/scan/cursor/condition`，`record:read` |
| 病案统计 | `/statistics` | `GET /api/v1/statistics`、CSV 导出，`statistics:read` |
| 影像档案袋 | `/archive` | `GET /api/v1/img/search`、受保护原图读取，`record:read` |
| 用户与权限 | `/users` | `GET /api/v1/auth/users`，`user:manage` |
| 服务状态 | `/status` | `/api/v1/public/status/summary` |

有权限的页面才会发起数据请求；具体授权由后端最终执行。无权限时会展示权限提示，不以空数据或伪造数据替代。统计暂缺权限时首页仅展示允许读取的服务状态指标。

## 开发运行

需要 Node.js 22.12+ 或 24+、npm，以及可访问的 MRR 后端。

```bash
git clone https://github.com/weepwood/MRR-Admin.git
cd MRR-Admin
npm install
cp .env.example .env.local
npm run dev
```

默认访问 `http://127.0.0.1:9201`。Vite 将同源 `/api` 路径代理到 `http://127.0.0.1:18045`。请在 `.env.local` 通过 `VITE_PROXY_TARGET` 改为实际后端地址，不能配置为数据库地址。

生产部署时建议使用 Nginx 统一域名：

- `/` 转发至本项目静态 `dist`，SPA 非静态路径回退 `index.html`。
- `/api/` 转发至 MRR 后端，并保留 Authorization 等请求头。
- 为独立部署的前端单独配置域名或入口；**不要直接替换 MRR 原生的 `/archive` 路由**，除非已经确认切换方案。
- 采用 HTTPS，限制管理端网络访问并执行后端安全审计。

```bash
npm run typecheck
npm run build
npm run preview
```

本项目没有预置测试账号、演示数据或前端绕过权限的开关，必须通过 MRR 的正常登录流程访问。

## 安全与业务兼容

- MRR 返回 `{ code, message, data }`，2xx 业务码才视为成功；401 清除客户端会话，403 保留权限错误。
- JWT 暂存于当前标签页 `sessionStorage`，退出或会话失效时清理。**这不等于 HttpOnly Cookie 保护**；生产环境仍须加强 CSP、XSS 防护、HTTPS 和会话生命周期配置。
- 强制修改临时密码后清理会话，要求使用新密码重新登录。
- 患者身份证号默认掩码展示；不在浏览器 URL 路由中保存患者查询关键字。
- 病案号与上架号始终按字符串处理，保留前导零；病案号数字值 ≥ 10000000 时影像检索需同时输入上架号。
- 扫描大表使用 `afterId` 游标，不使用深度 OFFSET 分页；不从前端加载全部扫描记录。
- 原图使用受鉴权的 Blob 请求，不将 JWT 拼入图片地址。档案袋当前仅展示前 100 个结果的元数据卡片，不代表后端分页。
- 不在前端埋点、日志或错误报告中上传患者个人信息。

## 与上游的关系

组件与主题参考 [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)（MIT License，版权 © 2024 Sat Naing），保留其 `LICENSE`、基础 UI 组件和设计令牌。采用 React 19、Tailwind CSS v4、TanStack Query / Router、Lucide 和 Recharts；删除原模板与医疗业务无关的演示页面。

## 后续阶段

患者编辑 / 导入、用户审核与角色维护、OCR 审核、OSS 迁移、运行诊断与日志审计、异步导出任务、文档和更多影像浏览交互需要继续按 MRR 的真实接口、权限和异常响应逐项实现。当前不将这些功能声明为已完成。

实际部署前需要针对真实 MRR 后端完成权限矩阵、浏览器兼容、API 合约、错误处理、并发性能与安全回归。
