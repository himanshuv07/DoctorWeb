// This file only run on the server, not edge runtime — so we can safely use Node.js APIs here.
// We use a dynamic import to avoid loading database code in edge environments, which would cause errors.
// This ensures the database connection is established before any API routes are hit, and also allows us to seed the default admin user on server startup.

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initDatabase } = await import('./src/lib/database');
        await initDatabase();
    }
}