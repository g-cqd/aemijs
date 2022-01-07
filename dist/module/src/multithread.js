import{getGlobal as e,newUID as t}from"./utils.js";export class ExtendedWorker{constructor(e,t){"function"==typeof e&&(e=ExtendedWorker.prepareFromFunction(e,t)),this.worker=new Worker(e,t),t&&"promise"in t&&!0===t.promise?(this.worker.promise=!0,ExtendedWorker.assert(),this.worker.onmessage=ExtendedWorker.onMessage):this.worker.promise=!1}static prepareFromString(e,t){const r=[];if("object"==typeof t&&("localImports"in t&&("string"==typeof t.localImports?r.push(`${window.location.origin}${t.localImports}`):r.push(...t.localImports.map((e=>`${window.location.origin}${e}`)))),"importScripts"in t&&("string"==typeof t.importScripts?r.push(t.importScripts):r.push(...t.importScripts)),"includeHandler"in t&&!0===t.includeHandler&&r.push(`data:application/javascript;base64,${btoa(`(${ExtendedWorker.getExtendedWorkerHandler().toString()})();`)}`)),"string"==typeof e){let s;if("uglify"in t&&!0===t.uglify){const t=`data:application/javascript;base64,${btoa(`(${e})();`)}`;r.push(t),s=`importScripts('${r.join("', '")}');`}else s=`${r.length>0?`importScripts('${r.join("','")}');\n`:""}(${e})();`;const o=new Blob([s],{type:"text/javascript"});return URL.createObjectURL(o)}throw new Error(`WorkerString:${e} is not a string.`)}static prepareFromFunction(e,t){if("function"==typeof e)return ExtendedWorker.prepareFromString(e.toString(),t);throw new Error(`WorkerFunction:${e} is not a function.`)}static createFromString(e,t){const r=[];if("object"==typeof t&&("localImports"in t&&("string"==typeof t.localImports?r.push(`${window.location.origin}${t.localImports}`):r.push(...t.localImports.map((e=>`${window.location.origin}${e}`)))),"importScripts"in t&&("string"==typeof t.importScripts?r.push(t.importScripts):Array.isArray(t.importScripts)&&r.push(...t.importScripts)),"includeHandler"in t&&!0===t.includeHandler&&r.push(`data:application/javascript;base64,${btoa(`(${ExtendedWorker.getExtendedWorkerHandler().toString()})();`)}`)),"string"==typeof e){let s;if("uglify"in t&&!0===t.uglify){const t=`data:application/javascript;base64,${btoa(`(${e})();`)}`;r.push(t),s=`importScripts('${r.join("', '")}');`}else s=`${r.length>0?`importScripts('${r.join("','")}');\n`:""}(${e})();`;const o=new Blob([s],{type:"text/javascript"});return new ExtendedWorker(URL.createObjectURL(o),t)}throw new Error(`WorkerString:${e} is not a string.`)}static createFromFunction(e,t){if("function"==typeof e)return ExtendedWorker.createFromString(e.toString(),t);throw new Error(`WorkerFunction:${e} is not a function.`)}set onmessage(e){this.worker.onmessage=e}get onmessage(){return this.worker.onmessage}set onerror(e){this.worker.onerror=e}get onerror(){return this.worker.onerror}set onmessageerror(e){this.worker.onmessageerror=e}get onmessageerror(){return this.worker.onmessageerror}dispatchEvent(e){return this.worker.dispatchEvent(e)}addEventListener(e,t,r){return this.worker.addEventListener(e,t,r)}removeEventListener(e,t,r){this.worker.removeEventListener(e,t,r)}terminate(){this.worker.terminate()}postMessage(e,t){return ExtendedWorker.postMessage([e,t],this.worker)}static assert(){const t=e();return"ExtendedWorkers"in t?"resolves"in t.ExtendedWorkers&&"rejects"in t.ExtendedWorkers||(t.ExtendedWorkers.resolves={},t.ExtendedWorkers.rejects={}):t.ExtendedWorkers={resolves:{},rejects:{}},t.ExtendedWorkers}static postMessage(e,r){if(r.promise){const s=t(),[o,n]=e,i={id:s,data:o};return new Promise(((e,t)=>{ExtendedWorker.resolves[s]=e,ExtendedWorker.rejects[s]=t,n?r.postMessage(i,n):r.postMessage(i)}))}r.postMessage(...e)}static onMessage(e){const{id:t,err:r,data:s}=e.data,o=ExtendedWorker.resolves[t],n=ExtendedWorker.rejects[t];r?n&&r&&n(r):o&&o(s),ExtendedWorker.delete(t)}static get resolves(){return ExtendedWorker.assert().resolves}static get rejects(){return ExtendedWorker.assert().rejects}static delete(e){delete ExtendedWorker.resolves[e],delete ExtendedWorker.rejects[e]}static getExtendedWorkerHandler(){return function(){(globalThis||self||window).listeners=new class{constructor(){this.typeListeners={},this.addTypeListener("default",(e=>e)),this.self.onmessage=e=>{this.listen(e)}}get self(){return globalThis}listen(e){const{id:t,data:r}=e.data;"object"==typeof r&&"type"in r&&r.type in this.typeListeners?this.typeListeners[r.type](t,r,e):this.typeListeners.default(t,r,e)}addTypeListener(e,t,r={}){const{keepMessageEvent:s,propertyAccessor:o}=r;this.typeListeners[e]=(e,r,n)=>{const i=o?r[o]:r,a=t(...s?[n,i]:[i]);a instanceof Promise?a.then((t=>{this.self.postMessage({id:e,data:t})})).catch(console.error):this.self.postMessage({id:e,data:a})}}}}}}export default{ExtendedWorker};