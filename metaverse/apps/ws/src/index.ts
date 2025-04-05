import { WebSocketServer } from 'ws';
import { User } from './classes/User';
import { handleMediasoupMessage,runMediasoupWorker } from './mediasoup';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', async function connection(ws) {
  await runMediasoupWorker();

  ws.send(JSON.stringify({
    class: "game",
    type: "workers-created",
    payload: {}
  }))

  handleMediasoupMessage(ws);

  let user = new User(ws);

  ws.on('error', console.error);

  ws.on('close',()=>{
    user.destroy();
  });
});