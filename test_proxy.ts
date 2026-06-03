const p = new Proxy({}, {
  get(t, prop) {
     if (typeof prop === 'string') {
       const i = parseInt(prop, 10);
       if (!isNaN(i)) return i % 256;
     }
     return undefined;
  }
});
const start = Date.now();
let sum = 0;
for(let i=0; i<1000000; i++) {
  sum += p[i];
}
console.log('Time:', Date.now() - start, 'ms', sum);
