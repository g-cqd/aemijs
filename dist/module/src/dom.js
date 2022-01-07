import{objectForEach as e}from"./utils.js";export function hasClass(e,t){if(e&&e instanceof Element&&t&&"string"==typeof t)return e.classList.contains(t);throw new Error("Element and/or ClassName arguments are not correct.")}export function addClass(e,t,s){if(e&&e instanceof Element&&t&&"string"==typeof t)return s||!1?new Promise((s=>{window.requestAnimationFrame((()=>{e.classList.add(t),s(e.classList)}))})):(e.classList.add(t),e.classList);throw new Error("Element and/or ClassName arguments are not correct.")}export function removeClass(e,t,s){if(e&&e instanceof Element&&t&&"string"==typeof t)return s||!1?new Promise((s=>{window.requestAnimationFrame((()=>{e.classList.remove(t),s(e.classList)}))})):(e.classList.remove(t),e.classList);throw new Error("Element and/or ClassName arguments are not correct.")}export function toggleClass(e,t,s){const n=s||!1;if(e&&e instanceof Element&&t&&"string"==typeof t)return hasClass(e,t)?removeClass(e,t,n):addClass(e,t,n);throw new Error("Element and/or ClassName arguments are not correct.")}export function attr(e,t,s){return t&&"string"==typeof t?void 0!==s?e.setAttribute(t,s):e.getAttribute(t):e.attributes}export function data(e,t,s){return t&&"string"==typeof t?void 0!==s?(e.dataset[t]=s,e.dataset[t]):e.dataset[t]:e.dataset}export function ecs(...t){const{length:s}=t,n=t.filter((e=>!!e));if(0===s)return document.createElement("div");if(1!==s){const e=document.createElement("div");for(let t=0;t<s;t+=1)e.appendChild(ecs(n[t]));return e}let r=n[0];if(r instanceof Element)return r;const{actions:o,attr:a,class:i,data:c,_:l,events:d,id:m,ns:f,style:u,t:p}=r;if(m||i||p?(r=f&&"string"==typeof f?document.createElementNS(f,p&&"string"==typeof p?p:"div"):document.createElement(p&&"string"==typeof p?p:"div"),m&&(r.id=m),i&&("string"==typeof i?r.classList.add(i):Array.isArray(i)&&r.classList.add(...i))):r=document.createElement("div"),a&&e(a,((e,t)=>{t instanceof Promise?t.then((t=>{attr(r,e,t)})).catch((e=>{console.error(e)})):attr(r,e,t)})),c&&e(c,((e,t)=>{t instanceof Promise?t.then((t=>{r.dataset[e]=t})).catch((e=>{console.error(e)})):r.dataset[e]=t})),d)for(const e of d)r.addEventListener(...e);if(u&&e(u,((e,t)=>{t instanceof Promise&&t.then((t=>{r.style[e]=t})).catch((e=>{console.error(e)})),r.style[e]=t})),l)for(const e of"object"==typeof l&&Symbol.iterator in l?l:[l])if(e instanceof Element)r.appendChild(e);else if("string"==typeof e)r.innerHTML+=e;else if(e instanceof Promise){const t=document.createElement("template");r.appendChild(t),e.then((e=>{"string"==typeof e?(t.outerHTML+=e,t.remove()):r.replaceChild(ecs(e),t)})).catch((e=>{console.error("ecs error: ",e)}))}else["number","bigint","boolean","symbol"].includes(typeof e)?r.innerHTML+=`${e}`:r.appendChild(ecs(e));return o&&e(o,((e,t)=>{const s=e.split(/_\$/u);s.length>1?r[s[0]](...t):r[e](...t)})),r}export function ecsr(...e){const{currentScript:t}=document,{parentElement:s}=t;[document.head,document.documentElement].includes(s)||s.replaceChild(ecs(...e),t)}export default{hasClass,addClass,removeClass,toggleClass,attr,data,ecs,ecsr};