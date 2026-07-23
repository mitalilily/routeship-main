# RouteShip landing page

An interactive, responsive shipping platform experience built with React, Vite and Three.js.

## Commands

- `npm run dev` - start the local development server
- `npm run build` - create a production build
- `npm run start` - serve the production `dist/` folder on `PORT`
- `npm run lint` - run ESLint
- `npm run test:smoke` - verify content, WebGL, interactions and responsive navigation

## Railway Deployment

Create a Railway service from this monorepo with the root directory set to `landing`.
Railway will use `railway.json` and `nixpacks.toml` to install dependencies, run the Vite
build, and start the static server on Railway's injected `PORT`.

Manual settings:

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health check path: `/`
