                                                                        -- Enlace del personal con Supabase Auth.
-- User.role sigue siendo texto: VENDOR es un valor de aplicación, no un enum de Postgres.
-- No ejecutar esta migración desde el agente. El historial de migraciones de este proyecto está roto.
ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;

CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
