// state-crud skill — config slice (theme/lang/name).
//
// Same pattern in every elegant app: a single UPDATE_CONFIG action whose
// payload is shallow-merged into state. Pattern is fixed by the state-crud
// skill's "merge-update" idiom — independent of the user's domain entity.
// We only need the app-level brand name to set state.config.name.

export function emit(entity) {
  const appName = entity.appName || `${entity.name} App`;

  return {
    "src/state/config/config.type.js":
`export const UPDATE_CONFIG = "UPDATE_CONFIG"`,

    "src/state/config/config.type.test.js":
`import { UPDATE_CONFIG } from './config.type';

describe('Config Action Types', () => {
  it('exports UPDATE_CONFIG constant', () => {
    expect(UPDATE_CONFIG).toBe('UPDATE_CONFIG');
  });
});
`,

    "src/state/config/config.actions.js":
`import { UPDATE_CONFIG } from "./config.type";

export const updateConfig = (payload) => ({
  type: UPDATE_CONFIG,
  payload,
});
`,

    "src/state/config/config.actions.test.js":
`import { updateConfig } from './config.actions';
import { UPDATE_CONFIG } from './config.type';

describe('config actions', () => {
  it('should create an updateConfig action', () => {
    const payload = { theme: 'dark' };
    const action = updateConfig(payload);
    expect(action.type).toBe(UPDATE_CONFIG);
    expect(action.payload).toEqual(payload);
  });

  it('should create an updateConfig action with multiple properties', () => {
    const payload = { theme: 'dark', lang: 'fr' };
    const action = updateConfig(payload);
    expect(action.type).toBe(UPDATE_CONFIG);
    expect(action.payload).toEqual(payload);
  });
});
`,

    "src/state/config/config.initial.js":
`const intialConfigState = {
  name: "${appName}",
  lang: "en",
  theme: "light",
};

export default intialConfigState;
`,

    "src/state/config/config.reducer.js":
`import { UPDATE_CONFIG } from "./config.type";
import intialConfigState from "./config.initial";

const config = (state = intialConfigState, action) => {
  switch (action.type) {
    case UPDATE_CONFIG:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

export default config;
`,

    "src/state/config/config.reducer.test.js":
`import config from './config.reducer';
import initialConfigState from './config.initial';
import { UPDATE_CONFIG } from './config.type';

describe('Config Reducer', () => {
  it('returns the initial state when action type is not recognized', () => {
    const initialState = initialConfigState;
    const action = { type: 'UNKNOWN_ACTION' };
    
    const result = config(initialState, action);
    expect(result).toBe(initialState);
  });

  it('returns initial state when no state is provided', () => {
    const action = { type: UPDATE_CONFIG, payload: { theme: 'dark' } };
    const result = config(undefined, action);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  describe('UPDATE_CONFIG action', () => {
    it('updates the theme property', () => {
      const initialState = initialConfigState;
      
      const action = {
        type: UPDATE_CONFIG,
        payload: { theme: 'dark' },
      };
      
      const result = config(initialState, action);
      expect(result.theme).toBe('dark');
    });

    it('updates the name property', () => {
      const initialState = initialConfigState;
      
      const action = {
        type: UPDATE_CONFIG,
        payload: { name: 'Custom App' },
      };
      
      const result = config(initialState, action);
      expect(result.name).toBe('Custom App');
    });

    it('updates the lang property', () => {
      const initialState = initialConfigState;
      
      const action = {
        type: UPDATE_CONFIG,
        payload: { lang: 'es' },
      };
      
      const result = config(initialState, action);
      expect(result.lang).toBe('es');
    });

    it('updates multiple properties at once', () => {
      const initialState = initialConfigState;
      
      const action = {
        type: UPDATE_CONFIG,
        payload: { theme: 'dark', lang: 'fr' },
      };
      
      const result = config(initialState, action);
      expect(result.theme).toBe('dark');
      expect(result.lang).toBe('fr');
    });

    it('preserves other properties when updating one', () => {
      const initialState = initialConfigState;
      
      const action = {
        type: UPDATE_CONFIG,
        payload: { theme: 'dark' },
      };
      
      const result = config(initialState, action);
      expect(result.name).toBe(initialState.name);
      expect(result.lang).toBe(initialState.lang);
    });
  });
});
`,

    "src/state/config/config.selectors.js":
`const getConfig = (state) => state.config;

export const getTheme = (state) => getConfig(state).theme;

export const getAppName = (state) => getConfig(state).name;

export const getLanguage = (state) => getConfig(state).lang;
`,

    "src/state/config/config.selectors.test.js":
`import {
  getTheme,
  getAppName,
  getLanguage,
} from './config.selectors';

describe('Config Selectors', () => {
  const mockState = {
    config: {
      name: '${appName}',
      lang: 'en',
      theme: 'dark',
    },
  };

  describe('getTheme', () => {
    it('returns the current theme from state', () => {
      const result = getTheme(mockState);
      expect(result).toBe('dark');
    });

    it('handles different theme values', () => {
      const lightState = { config: { name: 'App', lang: 'en', theme: 'light' } };
      const result = getTheme(lightState);
      expect(result).toBe('light');
    });
  });

  describe('getAppName', () => {
    it('returns the app name from state', () => {
      const result = getAppName(mockState);
      expect(result).toBe('${appName}');
    });

    it('handles different app names', () => {
      const customState = { config: { name: 'My Custom App', lang: 'en', theme: 'light' } };
      const result = getAppName(customState);
      expect(result).toBe('My Custom App');
    });
  });

  describe('getLanguage', () => {
    it('returns the language from state', () => {
      const result = getLanguage(mockState);
      expect(result).toBe('en');
    });

    it('handles different language values', () => {
      const spanishState = { config: { name: 'App', lang: 'es', theme: 'light' } };
      const result = getLanguage(spanishState);
      expect(result).toBe('es');
    });
  });
});
`
  };
}
