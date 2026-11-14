import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const digest = b => createHash('sha256').update(b).digest('hex');
const hash = async p => { const h = createHash('sha256'); for await (const b of fs.createReadStream(p)) h.update(b); return h.digest('hex'); };
const write = async (p, v) => fsp.writeFile(p, JSON.stringify(v, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
const validTime = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
const fail = m => { throw new Error(m); };
async function cmd(bin, args, timeout = 120000) { return exec(bin, args, { timeout, maxBuffer: 128 * 1024 * 1024 }); }
async function git(...args) { return (await cmd('git', args)).stdout; }
async function identity() {
  const head = (await git('rev-parse','HEAD')).trim();
  const diff = await git('diff','--binary','HEAD','--');
  const staged = await git('diff','--cached','--binary','--');
  const unstaged = await git('diff','--binary','--');
  const names = (await git('ls-files','--others','--exclude-standard','-z')).split('\0').filter(Boolean).sort();
  const untracked = [];
  for (const name of names) { const st = await fsp.lstat(name); if (st.isSymbolicLink()) untracked.push({path:name,kind:'symlink',sha256:digest(await fsp.readlink(name))}); else if (st.isFile()) untracked.push({path:name,kind:'file',sha256:await hash(name),mode:st.mode & 0o777}); else fail('unsupported untracked entry'); }
  let repository = null;
  try { const remote = (await git('remote','get-url','origin')).trim(); const m = /^(?:https?:\/\/(?:[^/@]+@)?|ssh:\/\/(?:[^/@]+@)?|[^@/]+@)([^/:]+)[:/]([^?#]+?)(?:\.git)?$/.exec(remote); if (m) repository = `${m[1]}/${m[2].replace(/\.git$/, '')}`; } catch {}
  return {repository,head,dirty:!!(diff || staged || unstaged || untracked.length),trackedDiffSha256:digest(diff),stagedDiffSha256:digest(staged),unstagedDiffSha256:digest(unstaged),untracked};
}
async function getRun(dir) {
  const real = await fsp.realpath(dir), st = await fsp.stat(real);
  if (!st.isDirectory() || st.mode & 0o077 || (process.getuid && st.uid !== process.getuid())) fail('run directory must be owner-only');
  const meta = JSON.parse(await fsp.readFile(path.join(real,'run.json'),'utf8'));
  if (meta.schema !== 'test-board-t3-run-v1' || path.basename(real) !== `${meta.caseId}-${meta.runId}`) fail('invalid run directory');
  return {dir:real,meta};
}
export async function prepare({caseId,evidenceDir,dataKind,issue=null,environment='unspecified',retryOf=null}) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,100}$/.test(caseId || '') || !['fixture','mock','live'].includes(dataKind)) fail('invalid case or data kind');
  if (retryOf !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(retryOf)) fail('retryOf must be a run UUID');
  const root = await fsp.realpath(evidenceDir), st = await fsp.stat(root), repo = await fsp.realpath((await git('rev-parse','--show-toplevel')).trim());
  if (!st.isDirectory() || st.mode & 0o077 || (process.getuid && st.uid !== process.getuid()) || root === repo || root.startsWith(repo + path.sep)) fail('evidence directory must be private, owner-only and outside the worktree');
  const space = await fsp.statfs(root); if (Number(space.bavail) * Number(space.bsize) < 64 * 1024 * 1024) fail('less than 64 MiB available');
  const runId = randomUUID(), dir = path.join(root, `${caseId}-${runId}`);
  await fsp.mkdir(dir,{mode:0o700});
  const meta = {schema:'test-board-t3-run-v1',runId,caseId,issue,dataKind,environment,retryOf,startedAt:new Date().toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,git:await identity()};
  await write(path.join(dir,'run.json'),meta); await fsp.writeFile(path.join(dir,'run.log'),'',{flag:'wx',mode:0o600});
  return {runDir:dir,runId};
}
// Receipts are trusted harness assertions, not proof of tool provenance. Preserve failures.
export async function receipt(dir, entry) {
  const run = await getRun(dir);
  try { await fsp.access(path.join(run.dir,'result.json')); fail('run already finalized'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!entry || typeof entry !== 'object' || !['status','open','start','step','stop','test'].includes(entry.kind) || !validTime(entry.at)) fail('invalid receipt envelope');
  if (entry.kind !== 'test' && (typeof entry.ok !== 'boolean' || (entry.ok && (!entry.structuredContent || typeof entry.structuredContent !== 'object')))) fail('receipt requires ok and structuredContent on success');
  await fsp.appendFile(path.join(run.dir,'run.log'),JSON.stringify(entry)+'\n',{mode:0o600});
}
function analyze(entries) {
  let phase='initial', tab=null, priorTabs=null, before=null, pending=null, operations=0, invalid=[], steps=[], startedAt=null, stop=null, test=null, previous=0;
  const bad = s => invalid.push(s);
  const seenOperations = new Set();
  const target = c => c?.available === true && c.tabId === tab && c.control?.ownedByCaller === true && c.control?.owner === 'agent' && Array.isArray(c.tabs) && c.tabs.some(t => t.tabId === tab && t.ownedByCaller === true && t.owner === 'agent');
  for (const e of entries) {
    const ts=Date.parse(e.at); if (!Number.isFinite(ts) || ts < previous) bad('receipt time missing or out of order'); previous=ts;
    if (e.kind === 'test') { if (test || phase === 'done') bad('duplicate or late test receipt'); test=e; continue; }
    if (!e.ok) { bad(`${e.kind} failed`); if(e.kind==='start') phase='started'; if(e.kind==='stop') {stop=e; phase='done';} continue; }
    const c=e.structuredContent;
    if (e.kind === 'status') {
      if (phase === 'initial') { if (!c.available || !Array.isArray(c.tabs)) bad('initial status unavailable'); priorTabs = new Set((c.tabs || []).map(t=>t.tabId)); phase='status'; }
      else { if (!['opened','started','stopping'].includes(phase)) bad('status outside lifecycle'); if (!target(c)) bad('target ownership or identity mismatch'); if (pending) { if(e.position !== 'after' || e.operationId !== pending.operationId) bad('missing matching post-status'); pending=null; } else { if(e.position !== 'before' || !e.operationId || before || seenOperations.has(e.operationId)) bad('missing or duplicate pre-status operationId'); before=e.operationId; seenOperations.add(e.operationId); } }
    } else if (e.kind === 'open') {
      if (phase !== 'status' || e.arguments?.reuseExistingTab !== false || !c.tabId || priorTabs?.has(c.tabId)) bad('open must create a new tab');
      tab=c.tabId; if (!target(c)) bad('new tab is not owned'); phase='opened';
    } else if (e.kind === 'start') {
      if (phase !== 'opened' || !before || before !== e.operationId || c.tabId !== tab || c.recording !== true || !validTime(c.startedAt)) bad('invalid recording start');
      startedAt=c.startedAt; before=null; pending=e; phase='started';
    } else if (e.kind === 'step') {
      if (phase !== 'started' || pending || before !== e.operationId || !e.stepId || !e.tool || !validTime(e.startedAt) || Date.parse(e.startedAt)>Date.parse(e.at) || typeof e.outcome !== 'string' || !['passed','failed'].includes(e.outcome)) bad('invalid step sequence');
      operations++; steps.push({id:e.stepId,startedAt:e.startedAt || e.at,finishedAt:e.at,status:e.outcome,tool:e.tool,frameMapping:{seekable:false,status:'unverified',reason:'wall clock and media PTS are not calibrated'}}); before=null; pending=e;
    } else if (e.kind === 'stop') {
      if (phase !== 'started' || pending || before !== e.operationId || c.tabId !== tab || c.mimeType !== 'video/mp4' || typeof c.path !== 'string' || !c.path || !(c.sizeBytes > 0)) bad('invalid recording stop');
      before=null; pending=e; stop=e; phase='stopping';
    }
    if (phase === 'stopping' && !pending) phase='done';
  }
  if (phase !== 'done' || pending || before || !operations || !test || !stop || !startedAt) bad('required receipt or post-status missing');
  if (test?.status === 'passed' && steps.some(s => s.status !== 'passed')) bad('passed test contains failed step');
  if (test && (!['passed','failed','not-run'].includes(test.status) || !(test.exitCode === null || Number.isInteger(test.exitCode)) || !(test.signal === null || typeof test.signal === 'string') || !('interruption' in test))) bad('invalid test receipt');
  return {invalid,steps,startedAt,stop,test,operations};
}
async function inspectVideo(file, framesFile) {
  const st=await fsp.lstat(file); if (!st.isFile() || !st.size) fail('video missing or empty');
  const firstHash=await hash(file), warnings=[];
  const probe=await cmd('ffprobe',['-v','warning','-select_streams','v:0','-show_entries','stream=codec_name,width,height:format=duration','-of','json',file]); if(probe.stderr) warnings.push(probe.stderr);
  const info=JSON.parse(probe.stdout); if (!info.streams?.length) fail('video stream missing');
  const dec=await cmd('ffmpeg',['-v','warning','-xerror','-i',file,'-map','0:v:0','-f','null','-']); if(dec.stderr) warnings.push(dec.stderr);
  const frames=await cmd('ffprobe',['-v','warning','-select_streams','v:0','-show_frames','-show_entries','frame=pts_time','-of','json',file]); if(frames.stderr) warnings.push(frames.stderr);
  const pts=JSON.parse(frames.stdout).frames?.map((f,index)=>({index,pts:Number(f.pts_time)}));
  if (!pts?.length || pts.some((x,i)=>!Number.isFinite(x.pts) || (i && x.pts < pts[i-1].pts))) fail('decoded frame PTS missing or invalid');
  const sha256=await hash(file); if (sha256 !== firstHash) fail('video changed during readback');
  await write(framesFile,{schema:'test-board-video-frames-v1',sha256,frames:pts});
  const read=JSON.parse(await fsp.readFile(framesFile,'utf8')); if (read.sha256!==sha256 || read.frames.length!==pts.length) fail('frame sidecar readback failed');
  return {status:'passed',bytes:st.size,sha256,stream:info.streams[0],duration:Number(info.format?.duration)||null,decodedFrames:pts.length,first:pts[0],last:pts.at(-1),frames:path.basename(framesFile),warnings,visualInspection:'unverified'};
}
export async function finalize(dir) {
  const {dir:d,meta}=await getRun(dir);
  try { await fsp.access(path.join(d,'result.json')); fail('run already finalized'); } catch(e) { if(e.code !== 'ENOENT') throw e; }
  const raw=await fsp.readFile(path.join(d,'run.log'),'utf8'); let entries=[]; let parseError=null;
  try { entries=raw.split('\n').filter(Boolean).map(JSON.parse); } catch(e) { parseError=e.message; }
  const a=analyze(entries); if(parseError) a.invalid.push(`journal parse: ${parseError}`);
  const t=a.test || {};
  const result={schema:'test-board-e2e-result-v1',runId:meta.runId,caseId:meta.caseId,issue:meta.issue,runner:'t3-harness',dataKind:meta.dataKind,startedAt:meta.startedAt,finishedAt:new Date().toISOString(),timezone:meta.timezone,environment:{platform:process.platform,arch:process.arch,node:process.version,description:meta.environment,provider:'t3-preview',captureMethod:'unobserved'},git:meta.git,retryOf:meta.retryOf,test:{status:t.status || 'not-run',exitCode:t.exitCode ?? null,signal:t.signal ?? null,failedStep:t.failedStep ?? null},interruption:t.interruption ?? null,recording:{start:a.startedAt?'passed':'failed',startedAt:a.startedAt,stop:a.stop?.ok?'passed':'failed',save:'not-verified',targetContinuity:a.invalid.length?'failed':'passed',captureTargetIdentity:'unverified',readback:{status:'not-attempted',visualInspection:'unverified'}},artifacts:{video:'recording.mp4',log:'run.log'},steps:a.steps,error:a.invalid.length?a.invalid:null};
  if (a.stop?.ok && typeof a.stop.structuredContent?.path === 'string') {
    try { const source=a.stop.structuredContent.path; const stat=await fsp.lstat(source); if (!stat.isFile() || stat.size !== a.stop.structuredContent.sizeBytes) fail('stop source size mismatch'); await fsp.copyFile(source,path.join(d,'recording.mp4'),fs.constants.COPYFILE_EXCL); if (await hash(source)!==await hash(path.join(d,'recording.mp4'))) fail('copy hash mismatch'); result.recording.save='verified'; result.recording.readback=await inspectVideo(path.join(d,'recording.mp4'),path.join(d,'source-frames.json')); } catch(e) { result.recording.readback={status:'failed',error:e.message,visualInspection:'unverified'}; }
  }
  result.artifacts.logSha256=await hash(path.join(d,'run.log')); result.artifacts.logStatus='verified';
  await write(path.join(d,'result.json'),result); const saved=JSON.parse(await fsp.readFile(path.join(d,'result.json'),'utf8')); if(saved.runId!==meta.runId) fail('result readback failed');
  return {result,ok:!a.invalid.length && result.test.status==='passed' && result.test.exitCode===0 && !result.test.signal && !result.interruption && result.recording.start==='passed' && result.recording.stop==='passed' && result.recording.save==='verified' && result.recording.readback.status==='passed'};
}
export async function derive(dir, edit) {
  const {dir:d}=await getRun(dir), result=JSON.parse(await fsp.readFile(path.join(d,'result.json'),'utf8'));
  const source=path.join(d,'recording.mp4'), sourceHash=await hash(source);
  if (result.recording.readback?.status!=='passed' || sourceHash!==result.recording.readback.sha256) fail('verified source required');
  const frames=JSON.parse(await fsp.readFile(path.join(d,'source-frames.json'),'utf8'));
  if (frames.sha256!==sourceHash || !Array.isArray(frames.frames) || !frames.frames.length) fail('source frames unavailable');
  if (!Array.isArray(edit?.segments) || !edit.segments.length || !Number.isFinite(edit.outputFps) || edit.outputFps<=0 || edit.outputFps>120 || !Number.isFinite(edit.freezeSeconds) || edit.freezeSeconds<0 || edit.freezeSeconds>60) fail('invalid edit');
  const filters=[], plans=[]; let cursor=0;
  for (let i=0;i<edit.segments.length;i++) {
    const s=edit.segments[i]; if (![s.start,s.end,s.speed].every(Number.isFinite) || s.start<0 || s.end<=s.start || s.speed<=0 || s.speed>16 || s.start<frames.frames[0].pts || s.end>frames.frames.at(-1).pts) fail('invalid or out-of-range segment');
    const selected=frames.frames.filter(f=>f.pts>=s.start && f.pts<s.end); if(selected.length<2) fail('segment has fewer than two actual frames');
    filters.push(`[0:v]trim=start=${s.start}:end=${s.end},setpts=(PTS-STARTPTS)/${s.speed}[s${i}]`);
    const duration=(s.end-s.start)/s.speed; plans.push({sourceStart:s.start,sourceEnd:s.end,speed:s.speed,sourceFrames:selected,firstRetainedSourcePts:selected[0].pts,lastRetainedSourcePts:selected.at(-1).pts,actualAnchorRule:'first retained frame; setpts resets its PTS to zero',plannedDerivedStart:cursor,plannedDerivedEnd:cursor+duration,planningBasis:'requested duration only; actual frame durations, concat offsets and fps rounding unverified',verified:false}); cursor+=duration;
  }
  const concat=edit.segments.map((_,i)=>`[s${i}]`).join('');
  filters.push(`${concat}concat=n=${edit.segments.length}:v=1:a=0,tpad=stop_mode=clone:stop_duration=${edit.freezeSeconds},fps=${edit.outputFps}[out]`);
  const id=randomUUID(), file=path.join(d,`derived-${id}.mp4`), sidecar=path.join(d,`derived-${id}.json`);
  let status='failed', error=null, inspected=null, warnings=[];
  try { const enc=await cmd('ffmpeg',['-v','warning','-xerror','-i',source,'-filter_complex',filters.join(';'),'-map','[out]','-an','-n',file]); if(enc.stderr) warnings.push(enc.stderr); inspected=await inspectVideo(file,path.join(d,`derived-${id}-frames.json`)); if(await hash(source)!==sourceHash) fail('source changed during derivation'); status='generated'; } catch(e) { error=e.message; if(e.stderr) warnings.push(e.stderr); }
  const mapping={schema:'test-board-t3-derived-v1',status,error,source:{file:'recording.mp4',sha256:sourceHash,frames:'source-frames.json'},derived:{file:path.basename(file),sha256:inspected?.sha256 || null,readback:inspected},edit,plannedMapping:plans,verifiedMapping:[],mappingStatus:'unverified',reason:'filter timeline is a plan; frame correspondence and visual content have not been independently verified',warnings,visualInspection:'unverified'};
  await write(sidecar,mapping); const read=JSON.parse(await fsp.readFile(sidecar,'utf8')); if(read.source.sha256!==sourceHash) fail('derived sidecar readback failed');
  return {sidecar,status,error};
}
