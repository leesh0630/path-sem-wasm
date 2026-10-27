import { chromium } from "playwright";
import fs from "node:fs";
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const messages=[];
page.on("console",m=>messages.push(m.type()+": "+m.text()));
page.on("pageerror",e=>messages.push("PAGEERROR "+e.message));
try {
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>{
    const t=document.getElementById("engineLog").textContent;
    return t.includes("연결 완료 ·")||t.includes("자동 연결 실패 ·");
  },{},{timeout:600000});
  const result=await page.evaluate(()=>({
    log:document.getElementById("engineLog").textContent,
    meta:globalThis.PATH_TEST?.state.engineMeta
  }));
  if(!result.meta || result.meta.installMode!=="same-origin-sha256-bundle")
    throw Error("Bundled startup failed:\n"+result.log);
  await page.click("#demo");
  await page.click("#baseline");
  await page.waitForFunction(()=>{
    const st=globalThis.PATH_TEST.state;
    return !st.busy;
  },{},{timeout:300000});
  const baseline=await page.evaluate(()=>JSON.parse(JSON.stringify(globalThis.PATH_TEST.state.baseline)));
  if(!baseline?.ok || !baseline.valid || baseline.n!==300)throw Error("300-person example SEM failed: "+JSON.stringify(baseline));
  fs.writeFileSync("browser_check.json",JSON.stringify({startup:result,baseline},null,2));
  console.log("PASS: local packages, SHA-256, quadprog numeric solve, CFA and 300-person SEM.");
} finally {
  fs.writeFileSync("browser_console.txt",messages.join("\n"));
  fs.writeFileSync("engine_log.txt",await page.locator("#engineLog").textContent().catch(()=>"(not available)"));
  await browser.close();
}
