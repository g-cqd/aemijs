export const Cookies={expires(){const A=new Date;return A.setTime(A.getTime()+31557081599.999996),A.toGMTString()},get:A=>new Map(decodeURIComponent(document.cookie).split(/;/u).map((A=>A.trim().split(/[=]/u)))).get(A),has:A=>new Map(decodeURIComponent(document.cookie).split(/;/u).map((A=>A.trim().split(/[=]/u)))).has(A),set(A,e,t={}){const s=this.expires(),{expiration:o=s,sameSite:i="Strict",path:a="/"}=t,n=[`${A}=${encodeURIComponent(e)}`];n.push(`expires=${o}`),n.push(`path=${a}`),n.push(`SameSite=${i};Secure`),document.cookie=n.join(";")},delete(A){document.cookie=`${A}=;expires=0;`}};export class WebPTest{static get data(){return[["lossy","UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"],["lossless","UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="],["alpha","UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=="],["animation","UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"]]}static save(A){const e=getGlobal();return e.WebPTestResult=A.reduce(((A,[e,t])=>(e in A||(A[e]=t),A)),Object.create(null)),e.WebPTestResult}static imageLoading(A,e){return new Promise((t=>{const s=new Image;s.onload=function(){t([e,s.width>0&&s.height>0])},s.onerror=function(){t([e,!1])},s.src=A}))}static test(){const A=getGlobal();return new Promise((e=>{"WebPTestResult"in A?e(A.WebPTestResult):Promise.all(WebPTest.data.map((([A,e])=>WebPTest.imageLoading(`data:image/webp;base64,${e}`,A)))).then((A=>{e(WebPTest.save(A))}))}))}static get passed(){const A=getGlobal();let e;return new Promise((async t=>{e="WebPTestResult"in A?A.WebPTestResult:await WebPTest.test(),t(e.lossy&&e.lossless&&e.alpha&&e.animation)}))}}export default{Cookies,WebPTest};