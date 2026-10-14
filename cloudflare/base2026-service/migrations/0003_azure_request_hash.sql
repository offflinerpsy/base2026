ALTER TABLE azure_jobs ADD COLUMN request_sha256 TEXT CHECK(request_sha256 IS NULL OR length(request_sha256)=64);
CREATE TRIGGER azure_job_request_immutable BEFORE UPDATE OF request_sha256 ON azure_jobs BEGIN SELECT RAISE(ABORT,'immutable'); END;
