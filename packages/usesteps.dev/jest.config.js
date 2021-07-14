module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  resolver: require.resolve(`jest-pnp-resolver`),
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "./src/jest.setup.ts",
  ],
};
