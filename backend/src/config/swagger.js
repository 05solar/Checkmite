export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CheckMite Backend API',
    version: '1.0.0',
    description: '사육박스별 객체 탐지 · 밀도 · 활력도 · 증식률 분석 API',
  },
  servers: [{ url: '/api', description: 'Local development' }],

  components: {
    schemas: {
      CultureBox: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'A동 1번 사육박스' },
          startedAt: { type: 'string', format: 'date', example: '2026-05-01' },
          memo: { type: 'string', example: '고습도 조건', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Measurement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          boxId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['detection', 'density', 'vitality'] },
          measuredAt: { type: 'string', format: 'date-time' },
          countValue: { type: 'number', nullable: true },
          densityPerCm2: { type: 'number', nullable: true },
          vitalityScore: { type: 'number', nullable: true },
          activeRatio: { type: 'number', nullable: true },
          resultJson: { type: 'object', nullable: true },
        },
      },
      TrashedBox: {
        type: 'object',
        properties: {
          box: { $ref: '#/components/schemas/CultureBox' },
          measurements: { type: 'array', items: { $ref: '#/components/schemas/Measurement' } },
          deletedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
  },

  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: '서버 및 DB 상태 확인',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    service: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/culture-boxes': {
      get: {
        tags: ['사육박스'],
        summary: '활성 사육박스 목록 조회',
        responses: {
          200: {
            description: '사육박스 목록',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/CultureBox' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['사육박스'],
        summary: '사육박스 생성',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'startedAt'],
                properties: {
                  name: { type: 'string', example: 'A동 1번 사육박스' },
                  startedAt: { type: 'string', format: 'date', example: '2026-05-01' },
                  memo: { type: 'string', example: '고습도 조건' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '생성된 사육박스',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CultureBox' } } },
          },
          400: { description: '요청 값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/culture-boxes/{id}': {
      patch: {
        tags: ['사육박스'],
        summary: '사육박스 정보 수정',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  startedAt: { type: 'string', format: 'date' },
                  memo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '수정된 사육박스', content: { 'application/json': { schema: { $ref: '#/components/schemas/CultureBox' } } } },
          404: { description: '대상 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['사육박스'],
        summary: '사육박스 휴지통으로 이동 (soft delete)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: '삭제 결과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    box: { $ref: '#/components/schemas/CultureBox' },
                    measurements: { type: 'array', items: { $ref: '#/components/schemas/Measurement' } },
                  },
                },
              },
            },
          },
          404: { description: '대상 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/culture-boxes/{boxId}/measurements': {
      get: {
        tags: ['측정'],
        summary: '사육박스별 측정 이력 조회',
        parameters: [{ name: 'boxId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: '측정 목록',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Measurement' } } } },
          },
        },
      },
    },

    '/culture-boxes/{boxId}/growth': {
      get: {
        tags: ['증식률'],
        summary: '사육박스별 밀도 기반 증식률 조회',
        parameters: [
          { name: 'boxId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: '시작일 (기본: startedAt)' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: '종료일 (기본: 오늘)' },
        ],
        responses: {
          200: {
            description: '증식률 분석 결과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    boxId: { type: 'string' },
                    from: { type: 'string', format: 'date' },
                    to: { type: 'string', format: 'date' },
                    days: { type: 'number' },
                    currentDensityPerCm2: { type: 'number' },
                    firstDensityPerCm2: { type: 'number' },
                    densityChangePerCm2: { type: 'number' },
                    densityChangeRatePercent: { type: 'number' },
                    densityGrowthPerDay: { type: 'number' },
                    logDensityGrowthPerDay: { type: 'number' },
                    growthLabel: { type: 'string', enum: ['증식 활발', '감소 추세', '유지 관찰'] },
                    densityTrend: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, densityPerCm2: { type: 'number' } } } },
                    vitalityTrend: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, score: { type: 'number' } } } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/measurements': {
      post: {
        tags: ['측정'],
        summary: '측정 데이터 직접 저장 (모델 분석 없이)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['boxId', 'type'],
                properties: {
                  boxId: { type: 'string', format: 'uuid' },
                  type: { type: 'string', enum: ['detection', 'density', 'vitality'] },
                  measuredAt: { type: 'string', format: 'date-time' },
                  countValue: { type: 'number', nullable: true },
                  densityPerCm2: { type: 'number', nullable: true },
                  vitalityScore: { type: 'number', nullable: true },
                  activeRatio: { type: 'number', nullable: true },
                  resultJson: { type: 'object', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: '생성된 측정 객체', content: { 'application/json': { schema: { $ref: '#/components/schemas/Measurement' } } } },
          400: { description: '요청 값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/analysis/detection': {
      post: {
        tags: ['분석'],
        summary: '객체 탐지 분석 (이미지)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['boxId', 'file'],
                properties: {
                  boxId: { type: 'string', format: 'uuid' },
                  measuredAt: { type: 'string', format: 'date-time' },
                  file: { type: 'string', format: 'binary', description: '이미지 파일' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '탐지 결과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    measurementId: { type: 'string' },
                    boxId: { type: 'string' },
                    type: { type: 'string' },
                    measuredAt: { type: 'string' },
                    detection: {
                      type: 'object',
                      properties: {
                        countValue: { type: 'number' },
                        boxes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              className: { type: 'string' },
                              confidence: { type: 'number' },
                              x: { type: 'number' },
                              y: { type: 'number' },
                              width: { type: 'number' },
                              height: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: '요청 값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '사육박스 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/analysis/density': {
      post: {
        tags: ['분석'],
        summary: '밀도 분석 (영상)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['boxId', 'measuredAreaCm2', 'file'],
                properties: {
                  boxId: { type: 'string', format: 'uuid' },
                  measuredAt: { type: 'string', format: 'date-time' },
                  measuredAreaCm2: { type: 'number', description: '측정 면적 (cm²), 0 초과' },
                  file: { type: 'string', format: 'binary', description: '영상 파일' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '밀도 분석 결과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    measurementId: { type: 'string' },
                    boxId: { type: 'string' },
                    type: { type: 'string' },
                    measuredAt: { type: 'string' },
                    density: {
                      type: 'object',
                      properties: {
                        currentDensityPerCm2: { type: 'number' },
                        measuredAreaCm2: { type: 'number' },
                        peakCount: { type: 'number' },
                        averageCount: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/analysis/vitality': {
      post: {
        tags: ['분석'],
        summary: '활력도 분석 (영상)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['boxId', 'file'],
                properties: {
                  boxId: { type: 'string', format: 'uuid' },
                  measuredAt: { type: 'string', format: 'date-time' },
                  file: { type: 'string', format: 'binary', description: '영상 파일' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '활력도 분석 결과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    measurementId: { type: 'string' },
                    boxId: { type: 'string' },
                    type: { type: 'string' },
                    measuredAt: { type: 'string' },
                    vitality: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                        activeRatio: { type: 'number' },
                        trend: { type: 'array', items: { type: 'number' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/trash/culture-boxes': {
      get: {
        tags: ['휴지통'],
        summary: '삭제된 사육박스 목록 조회',
        responses: {
          200: {
            description: '삭제된 사육박스 목록',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TrashedBox' } } } },
          },
        },
      },
    },

    '/trash/culture-boxes/{id}/restore': {
      post: {
        tags: ['휴지통'],
        summary: '사육박스 복구',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: '복구된 사육박스',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    box: { $ref: '#/components/schemas/CultureBox' },
                    measurements: { type: 'array', items: { $ref: '#/components/schemas/Measurement' } },
                  },
                },
              },
            },
          },
          404: { description: '대상 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
