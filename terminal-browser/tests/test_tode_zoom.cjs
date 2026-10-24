'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {correction, install} = require('../scripts/tode_zoom.cjs');

function renderer(id, url, density=2) {
  const wc=new EventEmitter();
  Object.assign(wc,{id,url,zoom:1,density,dead:false,sets:0});
  wc.isDestroyed=()=>wc.dead;
  wc.getURL=()=>wc.url;
  wc.getZoomFactor=()=>wc.zoom;
  wc.setZoomFactor=z=>{wc.zoom=z;wc.sets++};
  wc.executeJavaScript=async()=>wc.zoom*wc.density;
  return wc;
}
function electron(contents) {
  return {app:new EventEmitter(),webContents:{getAllWebContents:()=>contents},
          BrowserWindow:{fromWebContents:()=>null}};
}
const origin='http://127.0.0.1:59998';

test('retina, terminal font zoom and display density changes stay at CSS density 1',async()=>{
  const wc=renderer(1,origin+'/?folder=/project');
  const policy=install({origin,version:'regression-1'},electron([wc]));
  try {
    await policy.refresh(); assert.equal(wc.zoom,.5);
    wc.zoom*=1.6; await policy.refresh(); assert.equal(wc.zoom,.5);
    wc.density=1; await policy.refresh(); assert.equal(wc.zoom,1);
    wc.density=3; await policy.refresh(); assert.equal(wc.zoom,1/3);
    const n=wc.sets;await policy.refresh();assert.equal(wc.sets,n);
  } finally {policy.dispose()}
});

test('ordinary previews and other local origins are not zoomed',async()=>{
  const wc=renderer(2,'http://127.0.0.1:59999/preview');
  const policy=install({origin,version:'regression-2'},electron([wc]));
  try {await policy.refresh();assert.equal(wc.sets,0)} finally {policy.dispose()}
});

test('new Terminal Code pages inherit policy and destroyed pages are released',async()=>{
  const api=electron([]);const policy=install({origin,version:'regression-3'},api);
  const wc=renderer(3,origin+'/?folder=/another');api.app.emit('web-contents-created',{},wc);
  try {
    await policy.refresh();assert.equal(wc.zoom,.5);
    wc.dead=true;wc.emit('destroyed');assert.equal(wc.listenerCount('did-finish-load'),0);
    await policy.refresh();assert.equal(wc.sets,1);
  } finally {policy.dispose()}
  assert.equal(api.app.listenerCount('web-contents-created'),0);
});

test('navigation or temporary renderer errors do not terminate correction',async()=>{
  const wc=renderer(4,origin);const api=electron([wc]);
  const policy=install({origin,version:'regression-4'},api);
  try {
    wc.executeJavaScript=async()=>{throw new Error('navigating')};await policy.refresh();
    wc.executeJavaScript=async()=>wc.zoom*wc.density;await policy.refresh();assert.equal(wc.zoom,.5);
    wc.url='https://example.com';wc.zoom=1;await policy.refresh();assert.equal(wc.zoom,1);
  } finally {policy.dispose()}
});

test('invalid readings are skipped, bounds are respected, already-normal pages are stable',()=>{
  for(const x of [NaN,Infinity,0,-1])assert.equal(correction(1,x),null);
  assert.equal(correction(1,1),null);
  assert.equal(correction(.25,8),null);
  assert.equal(correction(1,2),.5);
});
