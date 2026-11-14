import fs from 'node:fs/promises';
import { prepare, receipt, finalize, derive, inspect } from './e2e-t3-lifecycle.mjs';
const help=`Usage: test-board e2e --provider t3 prepare --case ID --evidence-dir DIR --data-kind fixture|mock|live [--issue N] [--environment TEXT] [--retry-of UUID]
       test-board e2e --provider t3 receipt --run DIR --input JSON_FILE
       test-board e2e --provider t3 finalize --run DIR
       test-board e2e --provider t3 derive --run DIR --input JSON_FILE
       test-board e2e --provider t3 inspect --run DIR --input JSON_FILE
See references/e2e-t3-preview.md for required receipts and harness contract.\n`;
try {
  const [phase,...args]=process.argv.slice(2);
  if (!phase || phase==='--help' || phase==='help') { process.stdout.write(help); }
  else {
    const o={}; for(let i=0;i<args.length;i+=2) { if(!args[i]?.startsWith('--') || !args[i+1] || o[args[i]]) throw new Error('expected unique --option value pairs'); o[args[i]]=args[i+1]; }
    const allowed={prepare:['--case','--evidence-dir','--data-kind','--issue','--environment','--retry-of'],receipt:['--run','--input'],finalize:['--run'],derive:['--run','--input'],inspect:['--run','--input']}[phase];
    if(!allowed || Object.keys(o).some(k=>!allowed.includes(k))) throw new Error('unknown phase or option');
    let out;
    if(phase==='prepare') out=await prepare({caseId:o['--case'],evidenceDir:o['--evidence-dir'],dataKind:o['--data-kind'],issue:o['--issue']??null,environment:o['--environment'],retryOf:o['--retry-of']??null});
    else if(phase==='receipt') { await receipt(o['--run'],JSON.parse(await fs.readFile(o['--input'],'utf8'))); out={accepted:true}; }
    else if(phase==='finalize') { out=await finalize(o['--run']); if(!out.ok) process.exitCode=1; }
    else if(phase==='derive') { out=await derive(o['--run'],JSON.parse(await fs.readFile(o['--input'],'utf8'))); if(out.status!=='generated') process.exitCode=1; }
    else out=await inspect(o['--run'],JSON.parse(await fs.readFile(o['--input'],'utf8')));
    process.stdout.write(JSON.stringify(out)+'\n');
  }
} catch(e) { console.error(`test-board e2e t3: ${e.message}`); process.exitCode=1; }
