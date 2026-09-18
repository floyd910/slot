import { demoLaunch } from '../../server/demoLaunch.js';
export default async request => {
  const result = demoLaunch({method:request.method,origin:request.headers.get('origin')},process.env);
  return new Response(result.body,{status:result.status,headers:result.headers});
};
