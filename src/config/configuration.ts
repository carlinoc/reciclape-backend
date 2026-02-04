/**
 * Configuración de la aplicación.
 * Lee variables de entorno con valores por defecto.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  // Database
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin',
    name: process.env.DB_NAME ?? 'DBReciclape',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  },
});