# sentry C

## 项目概述

sentryC 是一个网络监控工具，专注于 IP 地址管理和网络质量监测。它通过定期 ping 测试来收集网络延迟数据，并提供网络质量排名功能，帮助用户识别最佳的网络连接。

## 主要功能

### IP 地址管理
- IP 地址添加与查询
- 支持 CIDR 格式批量添加 IP 地址
- IP 地址分类与描述管理

### 网络监控
- 自动定时 ping 测试（每小时执行一次）
- 延迟数据收集与存储
- 数据自动清理（每天中午12点清理一周前的数据）

### 数据分析
- 网络质量排名
- 综合评分算法（考虑平均延迟、P95延迟、延迟稳定性、丢包率等因素）
- 适配移动端和桌面端的数据展示

## 技术栈

### 后端
- **语言**: TypeScript
- **Web 框架**: Hono
- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM
- **任务调度**: cron
- **并行处理**: Piscina

### 工具与库
- **网络工具**: ping
- **日期处理**: dayjs
- **数据验证**: zod
- **日志**: pino
- **表格展示**: table

## 部署方式

### Docker 部署

```sh
docker run -d \
  --name sentryc \
  -p 8970:8970 \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/sentry" \
  --restart unless-stopped \
  ghcr.io/xg4/sentryc
```

### 环境变量

- `PORT`: 服务端口（默认: 8970）
- `HOSTNAME`: 主机名（默认: localhost）
- `WORKER_CONCURRENCY`: 工作线程并发数（默认: 10）
- `DATABASE_URL`: PostgreSQL 数据库连接 URL（必需）

## 项目结构

- `/src`: 源代码目录
  - `/db`: 数据库相关代码
  - `/middlewares`: 中间件
  - `/routes`: API 路由
  - `/services`: 业务逻辑服务
  - `/utils`: 工具函数
- `/drizzle`: 数据库迁移文件

## API 接口

- `GET /ips`: 获取所有 IP 地址
- `POST /ips`: 添加 IP 地址
- `GET /rank`: 获取网络质量排名

## 特色

- 自动化的网络质量监测
- 科学的网络质量评分算法
- 容器化部署，易于安装和维护
- 定时数据清理，避免数据库膨胀