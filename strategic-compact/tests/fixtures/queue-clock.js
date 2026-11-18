'use strict';
// Fixture clock: no product timeout or threshold is changed.
if (!/^\d+$/.test(process.env.FAKE_NOW || '')) throw new Error('synthetic clock required');
Date.now = () => Number(process.env.FAKE_NOW);
