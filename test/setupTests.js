// Adds the DOM matchers (toBeInTheDocument, toBeChecked, ...) used by component tests.
// Loaded via setupFilesAfterEnv so it runs after the environment exists -- in a `node`
// environment there is no document, and jest-dom is simply unused rather than broken.
require('@testing-library/jest-dom');
