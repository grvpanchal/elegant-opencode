// server-app-shell skill — cached static skeleton.
//
// Skill principles:
//   • "Separate static shell from dynamic content"
//   • "Service worker caching" (the build supports it; storybook/vite config)
//   • "Instant perceived load" — the shell mounts immediately, then streams
//     in the dynamic page via React.
//
// Files emitted (independent of entity):
//   index.html, vite.config.js, package.json, .gitignore, README.md,
//   src/index.jsx, src/App.jsx, src/App.test.jsx, src/setupTests.js,
//   src/reportWebVitals.js, .storybook/main.js, .storybook/preview.js,
//   .storybook/preview-head.html
//
// Files that depend on the entity name (App.test.jsx asserts the brand) are
// parameterized off entity.appName.

export function emit(entity) {
  const appName = entity.appName || `${entity.name} App`;
  const projectName = (entity.projectName || `${entity.slice}-app`).toLowerCase();

  const out = {};

  out["index.html"] =
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Elegant React + Redux ${entity.slice} app" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>${appName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
`;

  out["vite.config.js"] =
`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 3000, open: true },
  build: { outDir: 'build' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: { reporter: ['text', 'html'] },
  },
});
`;

  out["package.json"] =
`{
  "name": "${projectName}",
  "version": "0.1.0",
  "private": true,
  "homepage": "./",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@redux-devtools/extension": "^4.0.0",
    "chota": "^0.9.2",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-redux": "^9.2.0",
    "redux": "^5.0.1",
    "redux-saga": "^1.4.2"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^10.3.5",
    "@storybook/addon-docs": "^10.3.5",
    "@storybook/addon-links": "^10.3.5",
    "@storybook/addon-onboarding": "^10.3.5",
    "@storybook/react": "^10.3.5",
    "@storybook/react-vite": "^10.3.5",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@vitejs/plugin-react": "^6.0.1",
    "@vitest/coverage-v8": "^4.1.4",
    "eslint-plugin-storybook": "^10.3.5",
    "jsdom": "^29.0.2",
    "prop-types": "^15.8.1",
    "storybook": "^10.3.5",
    "vite": "^8.0.8",
    "vitest": "^4.1.4"
  }
}
`;

  out[".gitignore"] =
`# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build
/dist
/storybook-static

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# vite
.vite/
`;

  out["README.md"] =
`# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.\\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\\
You may also see any lint errors in the console.

### \`npm test\`

Launches the test runner in the interactive watch mode.\\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### \`npm run build\`

Builds the app for production to the \`build\` folder.\\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### \`npm run eject\`

**Note: this is a one-way operation. Once you \`eject\`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can \`eject\` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except \`eject\` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use \`eject\`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### \`npm run build\` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
`;

  out["src/index.jsx"] =
`import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));

root.render(<App />);
`;

  out["src/App.jsx"] =
`
import { Provider } from "react-redux";
import HomePage from "./pages";
import store from "./state";
import ConfigContainer from "./containers/ConfigContainer";
import AtomicProvider from "./utils/providers/AtomicProvider";

import "chota/dist/chota.css"
import "./ui/theme.css";

const App = () => <HomePage />;

const RootApp = () => {
  return (
    <Provider store={store}>
      <AtomicProvider components={{}} modules={{}}>
        <ConfigContainer />
        <App />
      </AtomicProvider>
    </Provider>
  );
};

export default RootApp;
`;

  out["src/App.test.jsx"] =
`import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/${appName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/i);
  expect(linkElement).toBeInTheDocument();
});
`;

  out["src/setupTests.js"] =
`import '@testing-library/jest-dom/vitest';
`;

  out["src/reportWebVitals.js"] =
`const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
`;

  out[".storybook/main.js"] =
`/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
};
export default config;
`;

  out[".storybook/preview.js"] =
`/** @type { import('@storybook/react').Preview } */
import '../src/ui/theme.css';

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
`;

  out[".storybook/preview-head.html"] =
`<link rel="stylesheet" href="https://unpkg.com/chota@latest">`;

  return out;
}
