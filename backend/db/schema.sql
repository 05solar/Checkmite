CREATE TABLE IF NOT EXISTS culture_boxes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  started_at DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY,
  culture_box_id UUID REFERENCES culture_boxes(id),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  uploaded_file_id UUID REFERENCES uploaded_files(id),
  type TEXT NOT NULL CHECK (type IN ('detection', 'density', 'vitality')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  analysis_job_id UUID REFERENCES analysis_jobs(id),
  type TEXT NOT NULL CHECK (type IN ('detection', 'density', 'vitality')),
  measured_at TIMESTAMPTZ NOT NULL,
  count_value INTEGER,
  density_per_cm2 NUMERIC(10, 3),
  density_per_liter NUMERIC(14, 3),
  vitality_score NUMERIC(6, 2),
  active_ratio NUMERIC(6, 4),
  result_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS density_results (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  measured_area_cm2 NUMERIC(10, 3),
  peak_count INTEGER,
  average_count NUMERIC(10, 3),
  density_per_cm2 NUMERIC(10, 3),
  best_frame_count INTEGER,
  estimated_count_per_ml INTEGER,
  density_per_liter NUMERIC(14, 3),
  count_multiplier NUMERIC(10, 3),
  video_duration_seconds NUMERIC(10, 3),
  selected_frame_index INTEGER,
  selected_frame_quality JSONB,
  density_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS density_frame_counts (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  count_value INTEGER NOT NULL,
  quality JSONB
);

CREATE TABLE IF NOT EXISTS vitality_results (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  vitality_score NUMERIC(6, 2) NOT NULL,
  active_ratio NUMERIC(6, 4),
  average_speed_mm_per_sec NUMERIC(10, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vitality_series (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  score NUMERIC(6, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS detection_boxes (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  confidence NUMERIC(6, 5) NOT NULL,
  x NUMERIC(8, 5) NOT NULL,
  y NUMERIC(8, 5) NOT NULL,
  width NUMERIC(8, 5) NOT NULL,
  height NUMERIC(8, 5) NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_snapshots (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  first_density_per_cm2 NUMERIC(10, 3),
  current_density_per_cm2 NUMERIC(10, 3),
  density_change_per_cm2 NUMERIC(10, 3),
  density_change_rate_percent NUMERIC(10, 3),
  density_growth_per_day NUMERIC(10, 4),
  log_density_growth_per_day NUMERIC(10, 6),
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trash_events (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('deleted', 'restored')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_culture_boxes_deleted_at ON culture_boxes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_measurements_box_measured_at ON measurements(culture_box_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_measurements_type ON measurements(type);
CREATE INDEX IF NOT EXISTS idx_density_results_measurement ON density_results(measurement_id);
CREATE INDEX IF NOT EXISTS idx_vitality_results_measurement ON vitality_results(measurement_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_trash_events_entity ON trash_events(entity_type, entity_id);

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS density_per_liter NUMERIC(14, 3);
ALTER TABLE density_results ALTER COLUMN measured_area_cm2 DROP NOT NULL;
ALTER TABLE density_results ALTER COLUMN density_per_cm2 DROP NOT NULL;
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS best_frame_count INTEGER;
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS estimated_count_per_ml INTEGER;
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS density_per_liter NUMERIC(14, 3);
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS count_multiplier NUMERIC(10, 3);
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS video_duration_seconds NUMERIC(10, 3);
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS selected_frame_index INTEGER;
ALTER TABLE density_results ADD COLUMN IF NOT EXISTS selected_frame_quality JSONB;
ALTER TABLE density_frame_counts ADD COLUMN IF NOT EXISTS quality JSONB;
