// utils — fetchApi wrapper.
//
// The chota-react-saga template uses localStorage as a stand-in API so the
// generated app runs without a backend. Real apps swap the inner branches
// for real fetch() calls but keep the dispatch surface (path + method) the
// same.

export function emit(entity) {
  const slice = entity.slice;
  const upper = slice.toUpperCase();

  const api =
`// const config = {
//   apiEndpoint: "http://localhost:3000/api",
// };

const ${upper} = "${slice}";

/* istanbul ignore next */
if (!localStorage.getItem(${upper})) {
  localStorage.setItem(${upper}, '[]');
}

export default function fetchApi(
  path = "",
  options = { method: "GET", body: {} }
) {
  // return fetch(config.apiEndpoint + path, options);
  if (path === "/${slice}s" && options.method === "GET") {
    return get${pascal(slice)}();
  } else if (path === "/${slice}s" && options.method === "POST") {
    return add${pascal(slice)}(options.body);
  } else if (path === "/${slice}s" && options.method === "PUT") {
    return update${pascal(slice)}(options.body);
  } else if (path === "/${slice}s" && options.method === "DELETE") {
    return remove${pascal(slice)}(options.body);
  }
}

const wait = (callback, t) =>
  new Promise((resolve) => setTimeout(() => resolve(callback()), t));

export const get${pascal(slice)} = async (mockError) => {
  try {
    if (mockError) throw new Error();
    const ${slice}Response = await wait(() => localStorage.getItem(${upper}), 500);
    return { json: async () => JSON.parse(${slice}Response) };
  } catch (e) {
    const message = "Unable to get Items";
    console.error(message);
    throw message;
  }
};

export const modify${pascal(slice)} = async (modifyAction, { ${slice}Item, mockError }) => {
  try {
    if (mockError) throw new Error();
    const ${slice}ListResponse = await get${pascal(slice)}();
    const ${slice}List = await ${slice}ListResponse.json();
    const new${pascal(slice)}ListJson = modifyAction(${slice}List);
    await wait(() => localStorage.setItem(${upper}, new${pascal(slice)}ListJson), 200);
    return ${slice}Item;
  } catch (e) {
    const message = "unable to modify Item";
    console.error(message, e);
    throw message;
  }
};

export const add${pascal(slice)} = async (${slice}Item, mockError) =>
  modify${pascal(slice)}(
    (${slice}List) => {
      ${slice}List.push(${slice}Item);
      return JSON.stringify(${slice}List);
    },
    { ${slice}Item, mockError }
  );

export const update${pascal(slice)} = async (${slice}Item, mockError) =>
  modify${pascal(slice)}(
    (${slice}List) => {
      const new${pascal(slice)}List = ${slice}List.map((td) =>
        td.id === ${slice}Item.id ? { ...td, ...${slice}Item } : td
      );
      return JSON.stringify(new${pascal(slice)}List);
    },
    { ${slice}Item, mockError }
  );

export const remove${pascal(slice)} = async (${slice}Item, mockError) =>
  modify${pascal(slice)}(
    (${slice}List) => {
      const new${pascal(slice)}List = ${slice}List.filter((td) => td.id !== ${slice}Item.id);
      return JSON.stringify(new${pascal(slice)}List);
    },
    { ${slice}Item, mockError }
  );
`;

  const test =
`import fetchApi from './api';

describe('fetchApi', () => {
  it('returns a thenable for GET /${slice}s', () => {
    const r = fetchApi('/${slice}s', { method: 'GET' });
    expect(typeof r.then).toBe('function');
  });
});
`;

  return {
    "src/utils/api.js": api,
    "src/utils/api.test.js": test
  };
}

function pascal(s) {
  return s[0].toUpperCase() + s.slice(1);
}
