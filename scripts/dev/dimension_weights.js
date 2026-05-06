"use strict";

const DIMENSION = {
  ALIGNMENT: "\u65b9\u5411\u6821\u51c6\u529b",
  EXECUTION: "\u63a8\u8fdb\u95ed\u73af\u529b",
  RISK: "\u98ce\u9669\u6cbb\u7406\u529b",
  COORDINATION: "\u534f\u540c\u8c03\u5ea6\u529b",
  ORG_HEALTH: "\u7ec4\u7ec7\u884c\u4e3a\u5065\u5eb7\u5ea6",
};

// PRD-MVP recommended weights: 20 / 25 / 20 / 20 / 15.
const DIMENSION_WEIGHTS_PERCENT = Object.freeze({
  [DIMENSION.ALIGNMENT]: 20,
  [DIMENSION.EXECUTION]: 25,
  [DIMENSION.RISK]: 20,
  [DIMENSION.COORDINATION]: 20,
  [DIMENSION.ORG_HEALTH]: 15,
});

const DIMENSION_WEIGHTS_FRACTION = Object.freeze(
  Object.fromEntries(
    Object.entries(DIMENSION_WEIGHTS_PERCENT).map(([dimension, weight]) => [dimension, weight / 100])
  )
);

function weightedScore(score, dimension) {
  const numericScore = Number(score);
  const weight = DIMENSION_WEIGHTS_PERCENT[dimension];
  if (!Number.isFinite(numericScore) || weight === undefined) return "";
  const normalizedScore = numericScore > 10 ? numericScore / 100 : numericScore / 10;
  return Number((normalizedScore * weight).toFixed(2));
}

module.exports = {
  DIMENSION,
  DIMENSION_WEIGHTS_FRACTION,
  DIMENSION_WEIGHTS_PERCENT,
  weightedScore,
};
