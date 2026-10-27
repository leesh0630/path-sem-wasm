import assert from "node:assert/strict";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import fs from "node:fs";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const code=html.slice(html.indexOf("async function installBundledPackages"),html.indexOf("async function ensureBootPackage"));
let manifest, status, loaded, calls, writes, logs, body, bytes=new Uint8Array([1,2,3,4]);
const hash=Buffer.from(await webcrypto.subtle.digest("SHA-256",bytes)).toString("hex");
const good=()=>({schema:1,webR:"0.5.4",rMinor:"4.5",packages:[{name:"quadprog",version:"1.5-8",file:"quadprog_1.5-8.tgz",sha256:hash}]});
const ctx=vm.createContext({
 URL, location:{href:"https://example.test/lavaan/index.html",origin:"https://example.test"},
 AbortController,setTimeout,clearTimeout,crypto:webcrypto,Uint8Array,
 fetch:async()=>({status,ok:status===200,json:async()=>manifest}),
 engineLog:s=>logs.push(s),rq:JSON.stringify,
 fetchEngineFile:async()=>bytes,
 bootR:async(engine,code)=>{body=code;calls++;},
});
vm.runInContext(code,ctx);
const engine={evalRBoolean:async()=>loaded,FS:{writeFile:async()=>writes++}};
async function run(){return ctx.installBundledPackages(engine,["quadprog"],"4.5","https://webr.r-wasm.org/v0.5.4/");}
function reset(){manifest=good();status=200;loaded=false;calls=0;writes=0;logs=[];}
let passed=0;
reset();assert.equal(await run(),true);assert.equal(calls,1);assert.equal(writes,1);passed++;
assert(body.includes('[.][.]'));assert(!body.includes('\\\\.'));passed++;
reset();status=404;assert.equal(await run(),false);assert.equal(calls,0);passed++;
reset();manifest.rMinor="4.4";await assert.rejects(run,/불일치/);passed++;
reset();manifest.webR="0.5.3";await assert.rejects(run,/불일치/);passed++;
reset();manifest.packages=[];await assert.rejects(run,/누락/);passed++;
reset();manifest.packages[0].sha256="0".repeat(64);await assert.rejects(run,/해시 불일치/);assert.equal(writes,0);passed++;
reset();manifest.packages[0].file="../bad.tgz";await assert.rejects(run,/파일명/);passed++;
reset();loaded=true;assert.equal(await run(),true);assert.equal(writes,0);passed++;
reset();status=403;await assert.rejects(run,/HTTP 403/);passed++;
console.log(`${passed} mock loader checks passed. These do NOT prove Wasm build or real R execution.`);
