if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let t={};const c=e=>n(e,o),l={module:{uri:o},exports:t,require:c};s[o]=Promise.all(i.map((e=>l[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-b833909e"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-j-_RzD2m.js",revision:null},{url:"assets/index-0VZ0SIIL.js",revision:null},{url:"assets/index-mTttGqdW.css",revision:null},{url:"assets/logo-red-mJNcz07b.png",revision:null},{url:"icons/generate-icons.js",revision:"d2ec59f5261c074e21615b9c806e2540"},{url:"index.html",revision:"004fe28516063d9cf2ea6040ac622333"},{url:"manifest.json",revision:"62c7a8a98cca0069e41595bdc48cfffe"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"service-worker.js",revision:"1a9ed877441ebc1aa07f6206bfcc5c90"},{url:"manifest.webmanifest",revision:"9dfaf2e6c07cb7bb4607a5e3834e0259"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-cache",plugins:[new e.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")}));