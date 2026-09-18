import {demoLaunch} from './demoLaunch.js';
export const demoLaunchPlugin = env => ({name:'standalone-demo-launch',configureServer(server) {
  server.middlewares.use('/api/demo-launch',(req,res)=>{
    const result=demoLaunch({method:req.method,origin:req.headers.origin},env);
    res.statusCode=result.status;
    for(const [key,value] of Object.entries(result.headers)) res.setHeader(key,value);
    res.end(result.body);
  });
}});
