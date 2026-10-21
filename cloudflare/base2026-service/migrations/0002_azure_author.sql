-- Provisioned through the approved server administration boundary only; no browser write API.
CREATE TABLE azure_authorizations (
 id TEXT PRIMARY KEY CHECK(length(id)=64), workspace TEXT NOT NULL CHECK(workspace='operator'),
 project_id TEXT NOT NULL, binding_hash TEXT NOT NULL CHECK(length(binding_hash)=64),
 descriptor_json TEXT NOT NULL CHECK(json_valid(descriptor_json)),
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL,
 FOREIGN KEY(workspace,project_id) REFERENCES projects(workspace,id)
);
CREATE TRIGGER azure_approval_descriptor_immutable BEFORE UPDATE OF id,workspace,project_id,binding_hash,descriptor_json,expires_at,created_at ON azure_authorizations BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER azure_approval_no_delete BEFORE DELETE ON azure_authorizations BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TABLE azure_jobs (
 id TEXT PRIMARY KEY CHECK(length(id)=64), workspace TEXT NOT NULL CHECK(workspace='operator'),
 project_id TEXT NOT NULL, account_id TEXT NOT NULL, approval_id TEXT NOT NULL, operation_id TEXT NOT NULL,
 binding_hash TEXT NOT NULL, plan_hash TEXT NOT NULL, order_id TEXT NOT NULL, project_revision INTEGER NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('reserved','sending','completed','completed_held','failed','uncertain_cost')),
 request_sent INTEGER NOT NULL CHECK(request_sent IN (0,1)), reserved_micro INTEGER NOT NULL CHECK(reserved_micro>=0),
 result_json TEXT CHECK(result_json IS NULL OR (json_valid(result_json) AND length(CAST(result_json AS BLOB))<=60000)),
 usage_json TEXT CHECK(usage_json IS NULL OR json_valid(usage_json)), provider_id TEXT, response_model TEXT, error_code TEXT,
 created_at TEXT NOT NULL, deadline_at TEXT NOT NULL,
 FOREIGN KEY(workspace,project_id) REFERENCES projects(workspace,id), FOREIGN KEY(approval_id) REFERENCES azure_authorizations(id)
);
CREATE INDEX azure_jobs_account_time ON azure_jobs(account_id,created_at);
CREATE TRIGGER azure_job_identity_immutable BEFORE UPDATE OF id,workspace,project_id,account_id,approval_id,operation_id,binding_hash,plan_hash,order_id,project_revision,reserved_micro,created_at,deadline_at ON azure_jobs BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER azure_job_no_delete BEFORE DELETE ON azure_jobs BEGIN SELECT RAISE(ABORT,'immutable'); END;
