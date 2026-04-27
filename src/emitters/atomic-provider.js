// server-app-shell skill — Atomic context providers.
//
// Provides a React context that exposes theme + components/modules into any
// atom that needs to read app-level config. The TestProvider wraps both
// react-redux Provider and AtomicProvider and is used by every component
// test for a consistent test harness.

export function emit(entity) {
  const slice = entity.slice;
  return {
    "src/utils/providers/AtomicProvider.jsx":
`import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";

const atomicContext = createContext(null);

/* 
Play with the theme provider here. 
This component can be custom based on requirements on Atomic Design and Framework
*/

const AtomicProvider = ({ children, components, modules }) => {
  const theme = useSelector((state) => state.config.theme);
  return (
    <atomicContext.Provider value={{ components, modules, children, theme }}>
      {children}
    </atomicContext.Provider>
  );
};

export const useAtomicContext = () => {
  try {
    const ctx = useContext(atomicContext);
    if(!ctx) {
      throw new Error('no context');
    }
    return ctx;
  } catch(e) {
    console.error('Atomic context used outside Redux', e);
    return { theme: '' , components: {}, modules: {}};
  }
};

export default AtomicProvider;
`,

    "src/utils/providers/TestProvider.jsx":
`import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import rootReducer from '../../state/rootReducer';
import { createStore } from 'redux';
import AtomicProvider from './AtomicProvider';

export const createTestStore = (preloadedState = {}) => {
  return createStore(rootReducer, preloadedState);
};

const TestProvider = ({ children, preloadedState = {} }) => {
  const store = createTestStore(preloadedState);
  
  return (
    <Provider store={store}>
      <AtomicProvider>{children}</AtomicProvider>
    </Provider>
  );
};

export default TestProvider;
`,

    "src/utils/providers/TestProvider.test.jsx":
`import React from 'react';
import { render, screen } from '@testing-library/react';
import TestProvider, { createTestStore } from './TestProvider';

describe('TestProvider', () => {
  it('Renders children', () => {
    render(
      <TestProvider>
        <div>Test Child</div>
      </TestProvider>,
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('Renders with preloadedState', () => {
    render(
      <TestProvider preloadedState={{ config: { name: 'Custom App', lang: 'en', theme: 'dark' } }}>
        <div>Custom State</div>
      </TestProvider>,
    );
    expect(screen.getByText('Custom State')).toBeInTheDocument();
  });

  it('createTestStore creates a valid store', () => {
    const store = createTestStore();
    expect(store.getState()).toHaveProperty('${slice}');
    expect(store.getState()).toHaveProperty('filters');
    expect(store.getState()).toHaveProperty('config');
  });

  it('createTestStore with preloadedState', () => {
    const store = createTestStore({ config: { name: 'Preloaded', lang: 'fr', theme: 'dark' } });
    expect(store.getState().config.name).toBe('Preloaded');
  });
});
`
  };
}
