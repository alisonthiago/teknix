const fs = require('fs');
fetch('http://localhost:3000/api/upload/avatar', {
  method: 'POST',
  body: (() => {
    const fd = new FormData();
    fd.append('file', new Blob(['test'], { type: 'text/plain' }), 'test2.txt');
    fd.append('userId', '6f58029b-c770-4f25-a9f9-86dec6fb6137');
    return fd;
  })()
}).then(res => res.json()).then(console.log).catch(console.error);
