-- Append-only enforcement untuk tabel audit_logs (PRD §9.2, NFR-014).
-- Aplikasi hanya boleh INSERT; UPDATE/DELETE/TRUNCATE ditolak di level database.
-- (Trigger tidak direpresentasikan di schema.prisma — SQL ini ditulis manual.)

CREATE OR REPLACE FUNCTION audit_logs_append_only() RETURNS trigger AS $fn$
BEGIN
    RAISE EXCEPTION 'audit_logs bersifat append-only: % tidak diizinkan', TG_OP;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update_delete
    BEFORE UPDATE OR DELETE ON "audit_logs"
    FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();

CREATE TRIGGER audit_logs_no_truncate
    BEFORE TRUNCATE ON "audit_logs"
    FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_append_only();
