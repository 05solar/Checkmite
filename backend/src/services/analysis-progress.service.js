import { randomUUID } from 'node:crypto';

const jobs = new Map();

const now = () => new Date().toISOString();

export const analysisProgressService = {
  create({ type, totalSamples }) {
    const id = randomUUID();
    const job = {
      id,
      type,
      status: 'queued',
      percent: 0,
      message: '분석 대기 중',
      currentSample: 0,
      totalSamples,
      samples: Array.from({ length: totalSamples }, (_, index) => ({
        sampleIndex: index + 1,
        status: 'pending',
      })),
      result: null,
      error: null,
      createdAt: now(),
      updatedAt: now(),
    };
    jobs.set(id, job);
    return job;
  },

  get(id) {
    return jobs.get(id) || null;
  },

  update(id, patch) {
    const job = jobs.get(id);
    if (!job) return null;
    Object.assign(job, patch, { updatedAt: now() });
    return job;
  },

  updateSample(id, sampleIndex, patch) {
    const job = jobs.get(id);
    if (!job) return null;
    const sample = job.samples[sampleIndex - 1];
    if (!sample) return job;
    Object.assign(sample, patch);
    job.updatedAt = now();
    return job;
  },

  complete(id, result) {
    return this.update(id, {
      status: 'completed',
      percent: 100,
      message: '분석 완료',
      currentSample: this.get(id)?.totalSamples || 0,
      result,
    });
  },

  fail(id, error) {
    return this.update(id, {
      status: 'failed',
      message: '분석 실패',
      error: error instanceof Error ? error.message : String(error),
    });
  },
};
