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
  let phase='initial', tab=null, priorTabs=null, before=null, pending=null, operations=0, invalid=[], failures=[], testErrors=[], steps=[], startedAt=null, stop=null, test=null, previous=0;
  const bad = s => invalid.push(s);
  const validId = id => typeof id === 'string' && id.trim().length > 0;
  const matchesBefore = e => validId(before) && validId(e.operationId) && before === e.operationId;
  const target = c => c?.available === true && c.tabId === tab && c.control?.ownedByCaller === true && c.control?.owner === 'agent' && Array.isArray(c.tabs) && c.tabs.some(t => t.tabId === tab && t.ownedByCaller === true && t.owner === 'agent');
  const seenOperations = new Set();
  for (const e of entries) {
    const ts=Date.parse(e.at); if (!Number.isFinite(ts) || ts < previous) bad('receipt time missing or out of order'); previous=ts;
    if (e.kind === 'test') {
      if (test || phase !== 'started' || pending || before !== null || operations === 0) bad('test receipt outside completed steps and before stop');
      if (!test) test=e;
      continue;
    }
    if (!e.ok && !['start','step','stop'].includes(e.kind)) { bad(`${e.kind} failed`); continue; }
    const c=e.structuredContent;
    if (e.kind === 'status') {
      if (phase === 'initial') { if (!(c.available === false && c.tabId === null && c.tabs === undefined) && !(c.available === true && Array.isArray(c.tabs))) bad('initial status unavailable or incomplete'); priorTabs = new Set((c.tabs || []).map(t=>t.tabId)); phase='status'; }
      else {
        if (!['opened','started','stopping'].includes(phase)) bad('status outside lifecycle');
        if (!target(c)) bad('target ownership or identity mismatch');
        if (pending) {
          if(e.position !== 'after' || !validId(e.operationId) || !validId(pending.operationId) || e.operationId !== pending.operationId) bad('missing matching post-status');
          pending=null;
        } else {
          if(e.position !== 'before' || !validId(e.operationId) || before !== null || seenOperations.has(e.operationId)) { bad('missing or duplicate pre-status operationId'); before=null; }
          else { before=e.operationId; seenOperations.add(e.operationId); }
        }
      }
    } else if (e.kind === 'open') {
      if (phase !== 'status' || e.arguments?.reuseExistingTab !== false || !c.tabId || priorTabs?.has(c.tabId)) bad('open must create a new tab');
      tab=c.tabId; if (!target(c)) bad('new tab is not owned'); phase='opened';
    } else if (e.kind === 'start') {
      if (phase !== 'opened' || pending || test || !matchesBefore(e) || (e.ok && (c.tabId !== tab || c.recording !== true || !validTime(c.startedAt)))) bad('invalid recording start');
      if (e.ok) startedAt=c.startedAt; else failures.push('start failed');
      before=null; pending=e; phase='started';
    } else if (e.kind === 'step') {
      if (phase !== 'started' || pending || test || !matchesBefore(e) || !e.stepId || !e.tool || !validTime(e.startedAt) || Date.parse(e.startedAt)>Date.parse(e.at) || (e.ok && !['passed','failed'].includes(e.outcome))) bad('invalid step sequence');
      const status=e.ok ? e.outcome : 'failed';
      if (!e.ok) failures.push('step tool failed');
      operations++; steps.push({id:e.stepId,startedAt:e.startedAt || e.at,finishedAt:e.at,status,tool:e.tool,...(!e.ok ? {error:e.error ?? null} : {}),frameMapping:{seekable:false,status:'unverified',reason:'wall clock and media PTS are not calibrated'}}); before=null; pending=e;
    } else if (e.kind === 'stop') {
      if (phase !== 'started' || pending || !matchesBefore(e) || (e.ok && (c.tabId !== tab || c.mimeType !== 'video/mp4' || typeof c.path !== 'string' || !c.path || !(c.sizeBytes > 0)))) bad('invalid recording stop');
      if (!e.ok) failures.push('stop failed');
      before=null; pending=e; stop=e; phase='stopping';
    }
    if (phase === 'stopping' && !pending) phase='done';
  }
  if (phase !== 'done' || pending || before !== null || !operations || !test || !stop || !startedAt) bad('required receipt or post-status missing');
  if (test?.status === 'passed' && steps.some(s => s.status !== 'passed')) testErrors.push('passed test contains failed step');
  if (test && (!['passed','failed','not-run'].includes(test.status) || !(test.exitCode === null || Number.isInteger(test.exitCode)) || !(test.signal === null || typeof test.signal === 'string') || !('interruption' in test))) bad('invalid test receipt');
  let interruption=null;
  if (test?.interruption != null) {
    const value=test.interruption;
    if (typeof value === 'string' && value.trim()) interruption={reason:value,observedAt:test.at};
    else if (typeof value === 'object' && typeof value.reason === 'string' && value.reason.trim() && validTime(value.observedAt)) interruption={reason:value.reason,observedAt:value.observedAt};
    else bad('invalid interruption');
  }
  return {invalid,failures,testErrors,steps,startedAt,stop,test,interruption,operations};
}
async function inspectVideo(file, framesFile) {
  const st=await fsp.lstat(file); if (!st.isFile() || !st.size) fail('video missing or empty');
  const firstHash=await hash(file), warnings=[];
  const probe=await cmd('ffprobe',['-v','warning','-select_streams','v:0','-show_entries','stream=codec_name,width,height,pix_fmt:format=duration','-of','json',file]); if(probe.stderr) warnings.push(probe.stderr);
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
  const result={schema:'test-board-e2e-result-v1',runId:meta.runId,caseId:meta.caseId,issue:meta.issue,runner:'t3-harness',dataKind:meta.dataKind,startedAt:meta.startedAt,finishedAt:new Date().toISOString(),timezone:meta.timezone,environment:{platform:process.platform,arch:process.arch,node:process.version,description:meta.environment,agentBrowser:null,provider:'t3-preview',captureMethod:'unobserved'},git:meta.git,retryOf:meta.retryOf,test:{status:t.status || 'not-run',exitCode:t.exitCode ?? null,signal:t.signal ?? null,failedStep:t.failedStep ?? null},interruption:a.interruption,recording:{start:a.startedAt?'passed':'failed',startedAt:a.startedAt,stop:a.stop?.ok?'passed':'failed',save:'not-verified',targetContinuity:a.invalid.length?'failed':'passed',captureTargetIdentity:'unverified',readback:{status:'not-attempted',visualInspection:'unverified'}},artifacts:{video:'recording.mp4',log:'run.log'},steps:a.steps,error:[...a.invalid,...a.failures,...a.testErrors].join('; ') || null,protocolErrors:a.invalid,toolFailures:a.failures,testErrors:a.testErrors};
  if (a.stop?.ok && typeof a.stop.structuredContent?.path === 'string') {
    try { const source=a.stop.structuredContent.path; const stat=await fsp.lstat(source); if (!stat.isFile() || stat.size !== a.stop.structuredContent.sizeBytes) fail('stop source size mismatch'); await fsp.copyFile(source,path.join(d,'recording.mp4'),fs.constants.COPYFILE_EXCL); if (await hash(source)!==await hash(path.join(d,'recording.mp4'))) fail('copy hash mismatch'); result.recording.save='verified'; result.recording.readback=await inspectVideo(path.join(d,'recording.mp4'),path.join(d,'source-frames.json')); } catch(e) { result.recording.readback={status:'failed',error:e.message,visualInspection:'unverified'}; }
  }
  result.artifacts.logSha256=await hash(path.join(d,'run.log')); result.artifacts.logStatus='verified';
  await write(path.join(d,'result.json'),result); const saved=JSON.parse(await fsp.readFile(path.join(d,'result.json'),'utf8')); if(saved.runId!==meta.runId) fail('result readback failed');
  return {result,ok:!a.invalid.length && !a.failures.length && !a.testErrors.length && result.test.status==='passed' && result.test.exitCode===0 && !result.test.signal && !result.interruption && result.recording.start==='passed' && result.recording.stop==='passed' && result.recording.save==='verified' && result.recording.readback.status==='passed'};
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
  filters.push(`${concat}concat=n=${edit.segments.length}:v=1:a=0,tpad=stop_mode=clone:stop_duration=${edit.freezeSeconds},fps=${edit.outputFps},format=yuv420p[out]`);
  const id=randomUUID(), file=path.join(d,`derived-${id}.mp4`), sidecar=path.join(d,`derived-${id}.json`);
  let status='failed', error=null, inspected=null, warnings=[], verifiedMapping=[], verificationError=null;
  try {
    const graph=filters.join(';');
    const enc=await cmd('ffmpeg',['-v','warning','-xerror','-copyts','-i',source,'-filter_complex',graph,'-map','[out]','-an','-fps_mode','passthrough','-c:v','libx264','-qp','0','-pix_fmt','yuv420p','-n',file]);
    if(enc.stderr) warnings.push(enc.stderr);
    inspected=await inspectVideo(file,path.join(d,`derived-${id}-frames.json`));
    if(inspected.stream.pix_fmt !== 'yuv420p') fail('derived pixel format mismatch');
    if(await hash(source)!==sourceHash) fail('source changed during derivation');
    status='generated';
    try {
      const md5 = async args => {
        const r=await cmd('ffmpeg',['-v','warning','-xerror',...args,'-an','-fps_mode','passthrough','-pix_fmt','yuv420p','-f','framemd5','-']);
        if(r.stderr) warnings.push(r.stderr);
        const tb=/^#tb 0: (\d+)\/(\d+)$/m.exec(r.stdout); if(!tb || Number(tb[2])===0) fail('framemd5 timebase unavailable');
        const lines=r.stdout.split('\n').filter(line=>line && !line.startsWith('#'));
        return lines.map(line=>{ const cols=line.split(',').map(x=>x.trim()); const pts=Number(cols[2])*Number(tb[1])/Number(tb[2]); if(cols.length!==6 || !/^[0-9a-f]{32}$/i.test(cols[5]) || !Number.isSafeInteger(Number(cols[2])) || !Number.isFinite(pts)) fail('invalid framemd5 output'); return {hash:cols[5].toLowerCase(),pts}; });
      };
      const sourcePixels=await md5(['-copyts','-i',source,'-map','0:v:0']);
      const filteredPixels=await md5(['-copyts','-i',source,'-filter_complex',graph,'-map','[out]']);
      const decodedPixels=await md5(['-i',file,'-map','0:v:0']);
      const derivedFrames=JSON.parse(await fsp.readFile(path.join(d,`derived-${id}-frames.json`),'utf8')).frames;
      if(sourcePixels.length!==frames.frames.length || filteredPixels.length!==decodedPixels.length || decodedPixels.length!==derivedFrames.length || !decodedPixels.length || filteredPixels.some((f,i)=>f.hash!==decodedPixels[i].hash || Math.abs(f.pts-derivedFrames[i].pts)>0.000001)) fail('frame counts, filter/decode pixels or PTS differ beyond 1 microsecond');
      const sourceIndices=new Map(), filteredCounts=new Map();
      sourcePixels.forEach((f,i)=>sourceIndices.set(f.hash,[...(sourceIndices.get(f.hash)||[]),i]));
      filteredPixels.forEach(f=>filteredCounts.set(f.hash,(filteredCounts.get(f.hash)||0)+1));
      for(let i=0;i<decodedPixels.length;i++) {
        const h=decodedPixels[i].hash, candidates=sourceIndices.get(h) || [];
        if(candidates.length!==1 || filteredCounts.get(h)!==1) continue;
        const index=candidates[0], sourceFrame=frames.frames[index];
        if(!edit.segments.some(s=>sourceFrame.pts>=s.start && sourceFrame.pts<s.end)) continue;
        verifiedMapping.push({sourceFrame:index,sourcePts:sourceFrame.pts,filterFrame:i,filterPts:filteredPixels[i].pts,derivedFrame:i,derivedPts:derivedFrames[i].pts,pixelMd5:h,verification:'unique-source-and-filter-frame-pixel-match'});
      }
      if(await hash(source)!==sourceHash || await hash(file)!==inspected.sha256) fail('video changed during frame matching');
    } catch(e) { verifiedMapping=[]; verificationError=e.message; if(e.stderr) warnings.push(e.stderr); }
  } catch(e) { error=e.message; if(e.stderr) warnings.push(e.stderr); }
  const mapping={schema:'test-board-t3-derived-v1',status,error,source:{file:'recording.mp4',sha256:sourceHash,frames:'source-frames.json'},derived:{file:path.basename(file),sha256:inspected?.sha256 || null,readback:inspected},edit,plannedMapping:plans,verifiedMapping,mappingStatus:verifiedMapping.length?'partially-verified':'unverified',verificationError,verificationMethod:'yuv420p framemd5: unique source and filter frame, lossless decoded frame match by ordinal and PTS within 1 microsecond',reason:'pixel equivalence only; repeated identical frames, freeze duplicates, operation meaning, and unpaired frames remain unverified',warnings,visualInspection:'unverified'};
  await write(sidecar,mapping); const read=JSON.parse(await fsp.readFile(sidecar,'utf8')); if(read.source.sha256!==sourceHash || read.verifiedMapping.length!==verifiedMapping.length) fail('derived sidecar readback failed');
  return {sidecar,status,error,mappingStatus:mapping.mappingStatus,verifiedFrames:verifiedMapping.length,verificationError};
}

// A trusted human/harness attests to the visual observation. Range validation
// checks only that the cited PTS contains real decoded source frames.
export async function inspect(dir, observation) {
  const {dir:d}=await getRun(dir);
  const result=JSON.parse(await fsp.readFile(path.join(d,'result.json'),'utf8'));
  const source=path.join(d,'recording.mp4'), sourceHash=await hash(source);
  if(result.recording.readback?.status!=='passed' || sourceHash!==result.recording.readback.sha256) fail('verified source required');
  const frameData=JSON.parse(await fsp.readFile(path.join(d,'source-frames.json'),'utf8'));
  if(frameData.sha256!==sourceHash || !Array.isArray(frameData.frames) || !frameData.frames.length) fail('source frame sidecar unavailable');
  if(!observation || typeof observation.stepId!=='string' || !observation.stepId || observation.verdict!=='confirmed' || typeof observation.observer!=='string' || !observation.observer.trim() || typeof observation.note!=='string' || !observation.note.trim() || !validTime(observation.inspectedAt) || !Number.isFinite(observation.sourceStartPts) || !Number.isFinite(observation.sourceEndPts) || observation.sourceStartPts>observation.sourceEndPts) fail('invalid visual observation');
  const steps=result.steps.filter(s=>s.id===observation.stepId); if(steps.length!==1) fail('step ID missing or ambiguous');
  const list=frameData.frames;
  if(observation.sourceStartPts<list[0].pts || observation.sourceEndPts>list.at(-1).pts) fail('visual range outside actual source PTS');
  const selected=list.filter(f=>f.pts>=observation.sourceStartPts && f.pts<=observation.sourceEndPts);
  if(!selected.length) fail('visual range has no decoded source frame');
  const sidecar=path.join(d,`inspection-${randomUUID()}.json`);
  const record={schema:'test-board-t3-inspection-v1',runId:result.runId,caseId:result.caseId,source:{file:'recording.mp4',sha256:sourceHash,frames:'source-frames.json'},stepId:observation.stepId,testStepStatus:steps[0].status,visualObservation:observation,actualFrames:{first:selected[0],last:selected.at(-1),count:selected.length},rangeCheck:'passed',seekable:true,seekBasis:'trusted visual observation and actual source PTS; not wall-clock inference'};
  await write(sidecar,record); const saved=JSON.parse(await fsp.readFile(sidecar,'utf8')); if(saved.source.sha256!==sourceHash || saved.stepId!==record.stepId) fail('inspection sidecar readback failed');
  return {sidecar,seekable:true};
}
