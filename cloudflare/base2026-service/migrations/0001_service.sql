CREATE TABLE projects (
 workspace TEXT NOT NULL CHECK(workspace = 'operator'),
 id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision >= 1),
 state_json TEXT NOT NULL CHECK(json_valid(state_json) AND length(CAST(state_json AS BLOB)) <= 2097152),
 PRIMARY KEY(workspace,id)
);
CREATE TABLE operations (
 workspace TEXT NOT NULL, project_id TEXT NOT NULL, operation_id TEXT NOT NULL,
 request_sha256 TEXT NOT NULL CHECK(length(request_sha256)=64),
 revision INTEGER NOT NULL, kind TEXT NOT NULL, recorded_at TEXT NOT NULL,
 PRIMARY KEY(workspace,project_id,operation_id),
 FOREIGN KEY(workspace,project_id) REFERENCES projects(workspace,id)
);
CREATE TABLE accepted_order_lines (
 workspace TEXT NOT NULL, project_id TEXT NOT NULL, order_id TEXT NOT NULL,
 first_export_sha256 TEXT NOT NULL, recorded_at TEXT NOT NULL,
 PRIMARY KEY(workspace,project_id,order_id),
 FOREIGN KEY(workspace,project_id) REFERENCES projects(workspace,id)
);
CREATE TABLE download_receipts (
 id TEXT PRIMARY KEY, workspace TEXT NOT NULL, project_id TEXT NOT NULL,
 manifest_sha256 TEXT NOT NULL, artifact_sha256 TEXT NOT NULL, format TEXT NOT NULL,
 recorded_at TEXT NOT NULL, meaning TEXT NOT NULL CHECK(meaning='download_not_publication'),
 FOREIGN KEY(workspace,project_id) REFERENCES projects(workspace,id)
);
CREATE TRIGGER operations_no_update BEFORE UPDATE ON operations BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER operations_no_delete BEFORE DELETE ON operations BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER orders_no_update BEFORE UPDATE ON accepted_order_lines BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER orders_no_delete BEFORE DELETE ON accepted_order_lines BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER downloads_no_update BEFORE UPDATE ON download_receipts BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER downloads_no_delete BEFORE DELETE ON download_receipts BEGIN SELECT RAISE(ABORT,'immutable'); END;
