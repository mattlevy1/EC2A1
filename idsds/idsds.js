/* IDSDS dominance engine + random game generation. */
(function (root) {
  'use strict';

  var EPS = 1e-9;
  var ROW_LABELS = ['T', 'M', 'B'];
  var COL_LABELS = ['L', 'C', 'R'];
  var MAX_DENOM = 20;

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function cloneGame(game) {
    return {
      name: game.name,
      player1: { label: game.player1.label, strategies: game.player1.strategies.slice() },
      player2: { label: game.player2.label, strategies: game.player2.strategies.slice() },
      payoffs: game.payoffs.map(function (row) {
        return row.map(function (cell) { return [cell[0], cell[1]]; });
      })
    };
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, lo, hi) {
    return lo + Math.floor(rng() * (hi - lo + 1));
  }

  function parseSeed(value) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) return (Math.random() * 0xFFFFFFFF) >>> 0;
    return n >>> 0;
  }

  function formatFrac(n, k) {
    if (k === 1) return String(n);
    var g = gcd(n, k);
    n /= g; k /= g;
    if (k === 1) return String(n);
    if (n < 0) return '-\\frac{' + (-n) + '}{' + k + '}';
    return '\\frac{' + n + '}{' + k + '}';
  }

  function formatNumber(x) {
    if (Math.abs(x - Math.round(x)) < EPS) return String(Math.round(x));
    for (var k = 2; k <= MAX_DENOM; k++) {
      var n = Math.round(x * k);
      if (Math.abs(x * k - n) < 1e-6) return formatFrac(n, k);
    }
    return x.toFixed(2);
  }

  /* Mix n/k of ua and (k-n)/k of ub strictly beats us, integer payoffs. */
  function mixBeats(n, k, ua, ub, us) {
    for (var j = 0; j < ua.length; j++) {
      if (n * ua[j] + (k - n) * ub[j] <= k * us[j]) return false;
    }
    return true;
  }

  function findNiceMix(ua, ub, us) {
    for (var k = 2; k <= MAX_DENOM; k++) {
      var bestN = null;
      for (var n = 1; n < k; n++) {
        if (mixBeats(n, k, ua, ub, us)) {
          if (bestN === null || Math.abs(n - k / 2) < Math.abs(bestN - k / 2)) bestN = n;
        }
      }
      if (bestN !== null) return { n: bestN, k: k };
    }
    return null;
  }

  function payoffVec(player, idx, liveOpp, payoffs) {
    if (player === 1) {
      return liveOpp.map(function (j) { return payoffs[idx][j][0]; });
    }
    return liveOpp.map(function (i) { return payoffs[i][idx][1]; });
  }

  /* Prefer a pure dominator; otherwise a 2-strategy mix with a small-denominator weight. */
  function findDominator(player, idx, liveOwn, liveOpp, payoffs) {
    var us = payoffVec(player, idx, liveOpp, payoffs);
    var others = liveOwn.filter(function (i) { return i !== idx; });
    var i, a, b, ua, ub, mix;

    for (i = 0; i < others.length; i++) {
      ua = payoffVec(player, others[i], liveOpp, payoffs);
      if (ua.every(function (v, t) { return v > us[t]; })) {
        return { type: 'pure', support: [others[i]], weights: [1], n: 1, k: 1 };
      }
    }

    var best = null;
    for (a = 0; a < others.length; a++) {
      for (b = a + 1; b < others.length; b++) {
        ua = payoffVec(player, others[a], liveOpp, payoffs);
        ub = payoffVec(player, others[b], liveOpp, payoffs);
        mix = findNiceMix(ua, ub, us);
        if (mix && (!best || mix.k < best.k)) {
          best = {
            type: 'mixed',
            support: [others[a], others[b]],
            n: mix.n,
            k: mix.k
          };
        }
      }
    }
    return best;
  }

  function mixPayoff(dom, player, oppIdx, payoffs) {
    if (dom.type === 'pure') {
      return player === 1 ? payoffs[dom.support[0]][oppIdx][0] : payoffs[oppIdx][dom.support[0]][1];
    }
    var a = dom.support[0], b = dom.support[1];
    var ua = player === 1 ? payoffs[a][oppIdx][0] : payoffs[oppIdx][a][1];
    var ub = player === 1 ? payoffs[b][oppIdx][0] : payoffs[oppIdx][b][1];
    return (dom.n * ua + (dom.k - dom.n) * ub) / dom.k;
  }

  function dominatorMap(dom, liveOwn, names) {
    var map = {};
    var i, name;
    for (i = 0; i < liveOwn.length; i++) {
      map[names[liveOwn[i]]] = 0;
    }
    if (dom.type === 'pure') {
      map[names[dom.support[0]]] = 1;
      return map;
    }
    map[names[dom.support[0]]] = dom.n / dom.k;
    map[names[dom.support[1]]] = (dom.k - dom.n) / dom.k;
    return map;
  }

  function makeElimination(player, idx, dom, liveOwn, liveOpp, payoffs, ownNames, oppNames) {
    var checks = liveOpp.map(function (oppIdx) {
      var removedPayoff = player === 1 ? payoffs[idx][oppIdx][0] : payoffs[oppIdx][idx][1];
      return {
        opponent: oppNames[oppIdx],
        removedPayoff: removedPayoff,
        dominatorPayoff: mixPayoff(dom, player, oppIdx, payoffs)
      };
    });
    return {
      player: player,
      removed: ownNames[idx],
      removedIndex: idx,
      type: dom.type,
      dominator: dominatorMap(dom, liveOwn, ownNames),
      n: dom.n,
      k: dom.k,
      support: dom.support.slice(),
      checks: checks
    };
  }

  function findEliminations(liveRows, liveCols, payoffs, rowNames, colNames) {
    var elims = [];
    var i, idx, dom;
    for (i = 0; i < liveRows.length; i++) {
      idx = liveRows[i];
      dom = findDominator(1, idx, liveRows, liveCols, payoffs);
      if (dom) elims.push(makeElimination(1, idx, dom, liveRows, liveCols, payoffs, rowNames, colNames));
    }
    for (i = 0; i < liveCols.length; i++) {
      idx = liveCols[i];
      dom = findDominator(2, idx, liveCols, liveRows, payoffs);
      if (dom) elims.push(makeElimination(2, idx, dom, liveCols, liveRows, payoffs, colNames, rowNames));
    }
    return elims;
  }

  function solve(game) {
    var rowNames = game.player1.strategies;
    var colNames = game.player2.strategies;
    var payoffs = game.payoffs;
    var liveRows = rowNames.map(function (_, i) { return i; });
    var liveCols = colNames.map(function (_, i) { return i; });
    var path = [];

    function snapshot(eliminations) {
      path.push({
        liveRows: liveRows.slice(),
        liveCols: liveCols.slice(),
        eliminations: eliminations,
        survivors: {
          p1: liveRows.map(function (i) { return rowNames[i]; }),
          p2: liveCols.map(function (j) { return colNames[j]; })
        }
      });
    }

    snapshot([]);
    var guard, elims, delRows, delCols;
    for (guard = 0; guard < 20; guard++) {
      if (liveRows.length === 0 || liveCols.length === 0) break;
      elims = findEliminations(liveRows, liveCols, payoffs, rowNames, colNames);
      if (elims.length === 0) break;
      delRows = {};
      delCols = {};
      elims.forEach(function (e) {
        if (e.player === 1) delRows[e.removedIndex] = true;
        else delCols[e.removedIndex] = true;
      });
      liveRows = liveRows.filter(function (i) { return !delRows[i]; });
      liveCols = liveCols.filter(function (j) { return !delCols[j]; });
      snapshot(elims);
    }
    return path;
  }

  function profiles(survivors) {
    var out = [];
    survivors.p1.forEach(function (r) {
      survivors.p2.forEach(function (c) {
        out.push([r, c]);
      });
    });
    return out;
  }

  function randomMatrix(rng, nRows, nCols, lo, hi) {
    var payoffs = [];
    var i, j, row;
    for (i = 0; i < nRows; i++) {
      row = [];
      for (j = 0; j < nCols; j++) {
        row.push([randInt(rng, lo, hi), randInt(rng, lo, hi)]);
      }
      payoffs.push(row);
    }
    return {
      name: 'Random ' + nRows + '×' + nCols,
      player1: { label: 'Player 1', strategies: ROW_LABELS.slice(0, nRows) },
      player2: { label: 'Player 2', strategies: COL_LABELS.slice(0, nCols) },
      payoffs: payoffs
    };
  }

  function defaultFilters(path, game) {
    var last = path[path.length - 1];
    var n1 = game.player1.strategies.length;
    var n2 = game.player2.strategies.length;
    var rounds = path.length - 1;
    if (rounds < 1) return false;
    if (!last.survivors.p1.length || !last.survivors.p2.length) return false;
    if (last.survivors.p1.length === n1 && last.survivors.p2.length === n2) return false;
    return true;
  }

  function modeExtra(mode, path) {
    var last = path[path.length - 1];
    var nProf = last.survivors.p1.length * last.survivors.p2.length;
    var rounds = path.length - 1;
    if (mode === 'multiple') return nProf > 1;
    if (mode === 'unique') return last.survivors.p1.length === 1 && last.survivors.p2.length === 1;
    if (mode === 'easy') return rounds >= 1;
    if (mode === 'medium') return rounds >= 2;
    return true;
  }

  function generateRandom(seed, opts) {
    opts = opts || {};
    var mode = opts.mode || 'any';
    var nRows = opts.nRows || 3;
    var nCols = opts.nCols || 3;
    if (mode === 'easy') { nRows = 2; nCols = 2; }
    if (mode === 'medium') { nRows = 3; nCols = 3; }
    var lo = opts.lo != null ? opts.lo : 0;
    var hi = opts.hi != null ? opts.hi : 9;
    var rng = mulberry32(parseSeed(seed));
    var attempts = opts.attempts || 500;
    var i, game, path;

    function tryOnce(useExtra) {
      game = randomMatrix(rng, nRows, nCols, lo, hi);
      path = solve(game);
      if (!defaultFilters(path, game)) return false;
      if (useExtra && !modeExtra(mode, path)) return false;
      return true;
    }

    for (i = 0; i < attempts; i++) {
      if (tryOnce(true)) {
        return { game: game, path: path, seed: parseSeed(seed), relaxed: false, nRows: nRows, nCols: nCols, mode: mode };
      }
    }
    for (i = 0; i < attempts; i++) {
      if (tryOnce(false)) {
        return { game: game, path: path, seed: parseSeed(seed), relaxed: true, nRows: nRows, nCols: nCols, mode: mode };
      }
    }
    game = randomMatrix(rng, nRows, nCols, lo, hi);
    path = solve(game);
    return { game: game, path: path, seed: parseSeed(seed), relaxed: true, nRows: nRows, nCols: nCols, mode: mode };
  }

  var api = {
    cloneGame: cloneGame,
    mulberry32: mulberry32,
    parseSeed: parseSeed,
    formatNumber: formatNumber,
    formatFrac: formatFrac,
    solve: solve,
    profiles: profiles,
    generateRandom: generateRandom,
    findDominator: findDominator
  };

  root.IDSDS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
