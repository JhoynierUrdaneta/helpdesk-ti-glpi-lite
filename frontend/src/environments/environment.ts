export const environment = {
  production: true,
  apiUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000`
};
