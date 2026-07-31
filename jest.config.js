/** Pure-logic tests only (geometry, placement, theme) — no React Native runtime needed. */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.ts'],
    transform: {
        // The package tsconfig sets "types": [] — give tests the jest globals.
        '^.+\\.ts$': ['ts-jest', { tsconfig: { types: ['jest'] } }]
    }
}
