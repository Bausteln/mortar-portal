# 🎨 Mortar Portal

> Web UI for the Mortar Kubernetes proxy rules manager

This is the **frontend component** of Mortar. For full documentation, installation instructions, and architecture details, see the [main Mortar repository](https://gitlab.bausteln.ch/net-core/reverse-proxy/mortar-backend).

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 🏗️ Tech Stack

- React 18
- Vite
- React Router

## 🐳 Docker

```bash
docker build -t mortar-portal .
docker run -p 80:80 mortar-portal
```

## 📦 Deployment

This portal is deployed as part of the Mortar Helm chart. See the [main repository](https://gitlab.bausteln.ch/net-core/reverse-proxy/mortar-backend) for Helm installation instructions.

## 📄 License

BSD 3-Clause License - see [LICENSE](LICENSE) file for details
